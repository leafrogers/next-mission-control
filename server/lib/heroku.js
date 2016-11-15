const fetch = require('node-fetch');
const co = require('co');
const log = require('@financial-times/n-logger').default;
const debug = require('debug')('heroku');
const ms = require('ms');
const moment = require('moment');

const token = process.env.HEROKU_AUTH_TOKEN;
const memoizee = require('memoizee');

if(!token){
	throw new Error(`Missing HEROKU_AUTH_TOKEN`);
}

function api(endpoint, method = 'GET', data = null, headers = {}){
	debug('API CALL', endpoint, method, data, headers);
	return fetch(
		`https://api.heroku.com${endpoint}`,
		{
			method,
			headers: Object.assign({}, {
				'Accept': 'application/vnd.heroku+json; version=3',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token.trim()
			}, headers),
			body: data ? JSON.stringify(data) : null
		}
	).then(response => {
		if(!response.ok) {
			log.error({event: 'HEROKU_API_BAD_RESPONSE', status: `${response.status} ${response.statusText}`, endpoint});
			throw new Error('HEROKU_API_BAD_RESPONSE');
		}else{
			return response.json();
		}
	});
}

function getAppInfo(name){
	debug('getAppInfo', name);
	return co(function* (){
		return api('/apps/' + name)
	});
}

function scale(appId, quantity, size){
	debug('scale', appId, quantity, size);
	return co(function* (){
		return api(`/apps/${appId}/formation`, 'PATCH', {updates:[{quantity, size, type:'web'}]})
	});
}

function getCurrentFormation(appId){
	return co(function* (){
		const formation =  yield api(`/apps/${appId}/formation`);
		const {size, quantity} = formation.find(f => f.type === 'web');
		return {size, quantity};
	});
}

function memoize(fn){
	return memoizee(fn, {promise:true, maxAge:ms('15m'), preFetch:true});
}

function releases(appId){
	debug('releases', appId);
	return co(function *(){
		const releaseDetails = yield api(`/apps/${appId}/releases`, 'GET', null, {'Range':'version ..; order=desc'});
		return releaseDetails
			.filter(r => r.description.startsWith('Deploy') || r.description.startsWith('Rollback'))
			.slice(0, 20)
			.map(r => {
				return {
					version: r.version,
					description: r.description,
					id: r.id,
					date: moment(r.created_at).format('Do MMM YYYY HH:mm'),
					hash: r.description.includes('Deploy') ? r.description.replace('Deploy ', '') : null
				}
			})
	})
}

function rollback(appId, releaseId){
	debug('rollback', appId, releaseId);
	return co(function* (){
		return api(`/apps/${appId}/releases`, 'POST', {release:releaseId});
	});
}

module.exports = {
	getAppInfo: memoize(getAppInfo),
	scale,
	getCurrentFormation: getCurrentFormation,
	releases,
	rollback
};
