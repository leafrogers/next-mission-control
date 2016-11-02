const fetch = require('node-fetch');
const co = require('co');
const log = require('@financial-times/n-logger').default;
const debug = require('debug')('heroku');

const token = process.env.HEROKU_AUTH_TOKEN;

if(!token){
	throw new Error(`Missing HEROKU_AUTH_TOKEN`);
}

function api(endpoint, method = 'GET', data = null){
	debug('API CALL', endpoint, method);
	return fetch(
		`https://api.heroku.com${endpoint}`,
		{
			method,
			headers: {
				'Accept': 'application/vnd.heroku+json; version=3',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token.trim()
			},
			body: data ? JSON.stringify(data) : null
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

module.exports = {getAppInfo, scale, getCurrentFormation};
