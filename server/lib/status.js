const ping = require('./ping');
const co = require('co');
const debug = require('debug')('status');
const Case = require('case');

const severitytoStatusMap = new Map([
	['1', 'error'],
	['2', 'warning'],
	['3', 'problem']
]);

function getNodeStatus(node, info){
	debug('getNodeStatus', node.url);
	return co(function* (){
		const status = {
			region: node.region,
			url: node.url,
			name: node.url.replace(/https?:\/\//, '').replace('.herokuapp.com', ''),
			health: {overall:true, statusText:'OK', status:'ok'}
		};

		const gtgPing = yield ping(`${node.url}/__gtg`);
		status.up = gtgPing.result;
		for(let i of ['3', '2', '1']){
			const {result} = yield ping(`${node.url}/__health.${i}`);
			status.health[i] = result;
			if(!result){
				status.health.overall = false;
				status.health.status = severitytoStatusMap.get(i);
				status.health.statusText = `Error: Severity ${i}`;
			}
		}

		status.scale = {
			initial: {size: Case.capital(info.formation.web.size), quantity: info.formation.web.scale},
			current: node.currentFormation
		};

		debug('status', status);
		return status;
	}).catch(err => console.error(err.stack));
}

module.exports = function getAppStatus(info){
	return co(function* (){
		const status = {nodes: []};
		debug('getAppStatus', info);
		for(let node of info.nodes){
			const nodeStatus = yield getNodeStatus(node, info);
			status.nodes.push(nodeStatus);
		}

		status.up = status.nodes.every(n => n.up);
		status.healthy = status.nodes.every(n => n.health.overall);
		status.healthStatus = status.healthy ?
			'ok' :
			status.nodes.reduce((previous, current) => {
				console.log('reduce', previous, current)
				if(current.health.overall || previous === 'error'){
					return previous;
				}

				if(previous === current.health.status){
					return previous;
				}

				if(previous === 'warning' && current.health.status === 'error'){
					return current.health.status;
				}

				if(previous === 'problem' && ['warning', 'error'].includes(current.health.status)){
					return current.health.status;
				}

				if(previous === 'ok' && current.health.status !== 'ok'){
					return current.health.status;
				}
			}, 'ok');

		return status;
	});
};
