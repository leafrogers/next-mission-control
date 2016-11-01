// NOTE: These methods use an undocumented API which Heroku use internally for the dashboard, it may change or disappera at some point!

const fetch = require('node-fetch');
const co = require('co');
const log = require('@financial-times/n-logger').default;
const debug = require('debug')('heroku');
const querystring = require('querystring');
const moment = require('moment');

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

function errors(appId){
	return co(function* (){
		const params = Object.assign({}, getDateParams(), {'step':'10m'});
		const metrics = yield api(`/metrics/${appId}/router/errors`, params);
		return Object.keys(metrics.data).map(code => {
			const error = {code};
			if(ERROR_CODE_MAP.has(code)){
				error.title = ERROR_CODE_MAP.get(code);
			}

			//the data is an error of values, or null if no value, this lines adds up the values, ignoring null (and 0)
			error.count = metrics.data[code].reduce((p, c) => c ? p + c : p, 0);

			return error;
		});
	})
}

module.exports = {errors};
