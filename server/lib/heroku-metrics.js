// NOTE: These methods use an undocumented API which Heroku use internally for the dashboard, it may change or disappera at some point!

const fetch = require('node-fetch');
const co = require('co');
const log = require('@financial-times/n-logger').default;
const debug = require('debug')('heroku');
const querystring = require('querystring');
const moment = require('moment');
const memoizee = require('memoizee');
const ms = require('ms');
const config = require('./config')();

const token = process.env.HEROKU_AUTH_TOKEN;

if(!token){
	throw new Error(`Missing HEROKU_AUTH_TOKEN`);
}

const DEFAULT_WINDOW = [1, 'hours'];

const ERROR_CODE_MAP = new Map([
	['H10', 'App crashed'],
	['H12', 'Request timeout'],
	['H13', 'Connection Closed without response'],
	['H14', 'No web dynos running'],
	['H18', 'Server request interrupted'],
	['H19', 'Backend connection timeout'],
	['H21', 'Backend Connection refused'],
	['H27', 'Client request interrupted']
])

function api(endpoint, params = {}){
	debug('API CALL', endpoint, params);
	params['process_type'] = 'web';
	const q = querystring.stringify(params);
	return fetch(
		`https://api.metrics.heroku.com${endpoint}?${q}`,
		{
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token.trim()
			}
		}
	).then(response => {
		if(!response.ok) {
			log.error({event: 'HEROKU_API_BAD_RESPONSE', status: response.status, endpoint});
			throw new Error('HEROKU_API_BAD_RESPONSE');
		}else{
			return response.json();
		}
	});
}

function getDateParams(window){
	const win = window || DEFAULT_WINDOW;
	const end = moment();
	const start = moment(end).subtract(win[0], win[1]);
	return {
		'start_time' : start.toISOString(),
		'end_time': end.toISOString()
	}
}

function getParams(){
	return Object.assign({}, getDateParams(), {'step':'10m'});
}

function errors(appName){
	return co(function* (){
		const params = getParams();
		const appConfig = getAppConfig(appName);
		const thresholds = appConfig && appConfig.thresholds ? appConfig.thresholds.errorCode : config.default_thresholds.errorCode;
		const metrics = yield api(`/metrics/${appName}/router/errors`, params);
		return Object.keys(metrics.data).map(code => {
			const error = {code};
			if(ERROR_CODE_MAP.has(code)){
				error.title = ERROR_CODE_MAP.get(code);
			}

			//the data is an error of values, or null if no value, this lines adds up the values, ignoring null (and 0)
			error.count = metrics.data[code].reduce((p, c) => c ? p + c : p, 0);
			error.status = 'problem';
			for(let level of ['error', 'warning', 'ok']){
				if(thresholds[level].includes(code)){
					error.status = level;
				}
			}

			return error;
		});
	})
}

function calculateAverage(arr){
	return arr.reduce((p, c) => p + c, 0) / arr.length;
}

function findHighest(arr){
	return arr.reduce((p, c) => c > p ? c : p, 0);
}

function calculateStatus(val, percentage, thresholds){
	const valToUse = (typeof thresholds.error === 'string' && thresholds.error.includes('%') ) ? parseInt(percentage, 10) : val;
	for(let threshold of ['error', 'warning', 'problem']){
		if(thresholds[threshold] && valToUse > thresholds[threshold]){
			return threshold;
		}
	}

	return 'ok';
}

function getMetricValue(arr, thresholds, type, normalize){
	let val;
	let percentage;
	if(type === 'average'){
		val = calculateAverage(arr)
	}else if(type === 'highest'){
		val = findHighest(arr);
	}

	if(thresholds && thresholds.quota){
		percentage = Math.round((val / thresholds.quota) * 100);
	}

	if(normalize){
		val = Math[normalize](val);
	}

	return {value:val, status:calculateStatus(val, percentage, thresholds), percentage}
}

function getAppConfig(appName){
	if(!appName || !appName.replace){
		log.error({event:'NO_APP_NAME', appName});
		return {thresholds:config.default_thresholds};
	}
	const name = appName.replace(/^ft-next-/, '').replace(/(-eu|-us)$/, '').replace('-v003', '');
	const appConfig = config.apps.find(app => app.name === name);
	if(!appConfig){
		log.error({event:'NO_APP_CONFIG', name});
		return {thresholds:config.default_thresholds};
	}else{
		return appConfig;
	}
}

function getThresholds({appName, category, type = null, quota}){
	try{
		const appConfig  = getAppConfig(appName);
		const thresholds = type ? appConfig.thresholds[category][type] : appConfig.thresholds[category];
		thresholds.quota = quota;
		return thresholds;
	}catch(e){
		log.error({event:'NO_APP_THRESHOLDS_FOUND', name, error:e.message, stack:e.stack.replace(/\n/g, '; ')});
		return {};
	}
}

function memory(appName){
	return co(function* (){
		const params  = getParams();
		const metrics = yield api(`/metrics/${appName}/dyno/memory`, params);
		const memoryUsage = {rawData:metrics};
		const thresholdArgs = type => Object.assign({}, {appName, category:'memory', type, quota:metrics.data.memory_quota[0]});
		memoryUsage.average = getMetricValue(metrics.data.memory_average, getThresholds(thresholdArgs('average')), 'average', 'round');
		memoryUsage.max = getMetricValue(metrics.data.memory_total_max, getThresholds(thresholdArgs('max')), 'highest', 'ceil');
		memoryUsage.maxRss = getMetricValue(metrics.data.memory_max_rss, getThresholds(thresholdArgs('max_rss')), 'highest', 'ceil');
		return memoryUsage;
	})
}

function responseTime(appName){
	return co(function* (){
		const params = getParams();
		const metrics = yield api(`/metrics/${appName}/router/latency`, params);
		const responseTimes = {rawData:metrics};
		const thresholdArgs = type => Object.assign({}, {appName, category:'responseTime', type});
		responseTimes.median = getMetricValue(metrics.data.latency_p50, getThresholds(thresholdArgs('median')), 'average' , 'round');
		responseTimes.p95 = getMetricValue(metrics.data.latency_p95, getThresholds(thresholdArgs('p95')), 'average', 'round');
		return responseTimes;
	});
}

function responseStatus(appName){
	return co(function* (){
		const params = getParams();
		const metrics = yield api(`/metrics/${appName}/router/status`, params);
		const responseStatus = {rawData:metrics};
		const thresholds = getThresholds({appName, category:'responseStatus', type:'5XX'});
		responseStatus.list = Object.keys(metrics.data).map(status => {
			const val = getMetricValue(metrics.data[status], status.startsWith('5') ? thresholds : {}, 'average', 'round');
			val.code = status;
			return val;
		});
		responseStatus.list.sort((a, b) => b.value - a.value);
		responseStatus.total = responseStatus.list.reduce((p, c) => p + c.value, 0);

		return responseStatus;
	})
}

function load(appId){
	return co(function* (){
		const params = getParams();
		const metrics = yield api(`/metrics/${appId}/dyno/load`, params);
		const load = {rawData:metrics};
		load.mean = getMetricValue(metrics.data.load_mean, {}, 'average');
		load.max = getMetricValue(metrics.data.load_max, {}, 'highest');

		return load;
	})
}

function memoize(fn){
	return memoizee(fn, {promise: true, maxAge: ms('1m'), preFetch: true});
}

const funcs = [errors, memory, responseTime, responseStatus, load];

for(let fn of funcs){
	module.exports[fn.name] = memoize(fn);
}

module.exports.flush = () => {
	funcs.forEach(fn => {
		module.exports[fn.name].clear();
	})
};
