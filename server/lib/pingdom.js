const fetch = require('node-fetch');
const log = require('@financial-times/n-logger').default;


function status(id){
	log.info({event:'PINGDOM_CHECK', id});
	const url = `https://api.pingdom.com/api/2.0/results/${id}?limit=5`;
	const headers = {
		'Authorization': `Basic ${new Buffer(`${process.env.PINGDOM_USERNAME}:${process.env.PINGDOM_PASSWORD}`).toString('base64')}`,
		'App-Key': process.env.PINGDOM_API_KEY,
		'Account-Email': 'ftpingdom@ft.com'
	};
	console.log('HEADERS', headers);
	return fetch(url, {headers})
		.then(response => {
			if(!response.ok){
				throw new Error(`Bad response from pingdom, status:${response.status} ${response.statusText}`);
			}

			return response.json()
		})
		.then(json => {
			const result = json.results.length && json.results[0].status === 'up';
			log.info({event:'PINGDOM_RESULT', id, result});
			return {result}
		})
}

module.exports = {status};
