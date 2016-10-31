const fetch = require('node-fetch');
const debug = require('debug')('ping');

const ATTEMPTS = 3;
const THRESHOLD = 2;

module.exports = function ping(url){
	debug('ping', url);
	const fetches = [];
	for(let i=0; i<ATTEMPTS; i++){
		fetches.push(
			fetch(url).catch(() => Promise.resolve({ok:false}))
		);
	}

	return new Promise((resolve) => {
		Promise.all(fetches)
			.then(responses => {
				debug('PING RESPONSES', responses.map(r => r.ok));
				const result = responses.filter(r => r.ok).length >= THRESHOLD;
				debug('PING RESULT', result);
				resolve({result});
			})
	});

};
