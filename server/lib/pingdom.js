const fetch = require('node-fetch');
const log = require('@financial-times/n-logger').default;
const co = require('co');


function status(id){
	log.info({event:'PINGDOM_CHECK', id});
	const url = `https://api.pingdom.com/api/2.0/results/${id}?limit=5`;
	const headers = {
		'Authorization': `Basic ${new Buffer(`${process.env.PINGDOM_USERNAME}:${process.env.PINGDOM_PASSWORD}`).toString('base64')}`,
		'App-Key': process.env.PINGDOM_API_KEY,
		'Account-Email': 'ftpingdom@ft.com'
	};

	return co(function* (){
		const response = yield fetch(url, {headers});
		if(!response.ok){
			const errorResponse = yield response.json();
			log.error({event:'PINGDOM_ERROR'}, errorResponse.error);
			throw new Error(`Pingdom Bad Response: ${response.status} ${response.statusText}`);
		}else{
			const responseData = yield response.json();
			const result = responseData.results.length && responseData.results[0].status === 'up';
			log.info({event:'PINGDOM_RESULT', id, result});
			return {result}
		}
	})
}

module.exports = {status};
