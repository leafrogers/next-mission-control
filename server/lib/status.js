const ping = require('./ping');
const co = require('co');
const debug = require('debug')('status');
const Case = require('case');


function getNodeStatus(node, info){
	debug('getNodeStatus', node.url);
	return co(function* (){
		const status = {
			region: node.region,
			url: node.url,
			name: node.url.replace(/https?:\/\//, '').replace('.herokuapp.com', ''),
			health: {overall:true, statusText:'OK'}
		};

		const gtgPing = yield ping(`${node.url}/__gtg`);
		status.up = gtgPing.result;
		for(let i of ['3', '2', '1']){
			const {result} = yield ping(`${node.url}/__health.${i}`);
			status.health[i] = result;
			if(!result){
				status.health.overall = false;
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

		return status;
	});
};
