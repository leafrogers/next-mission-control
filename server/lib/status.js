const ping = require('./ping');
const co = require('co');
const debug = require('debug')('status');
const Case = require('case');
const health = require('./health');

const severitytoStatusMap = new Map([
	['1', 'error'],
	['2', 'warning'],
	['3', 'problem']
]);

function getNodeStatusMessages(status, metrics){
	const messages = [];
	if(!status.up){
		messages.push({status:'error', text:'App in not responding to /__gtg requests'})
	}

	if(metrics.errors.length){
		for(let error of metrics.errors){
			if(error.status !== 'ok'){
				messages.push({status:error.status, text:`There have been ${error.count} ${error.title} (${error.code}) errors in the last hour`});
			}
		}
	}

	if(!status.health.overall){
		messages.push({status:status.health.status, text:status.health.statusText});
	}

	if(metrics.memory.average.status !== 'ok'){
		messages.push({status:metrics.memory.average.status, text: `Average memory usage is ${metrics.memory.average.percentage}% of available memory`});
	}

	if(metrics.memory.max.status !== 'ok'){
		messages.push({status:metrics.memory.max.status, text: `App memory usage peaked at ${metrics.memory.max.percentage}% of available memory`});
	}

	if(metrics.responseTime.p95.status !== 'ok'){
		messages.push({status:metrics.responseTime.p95.status, text: `95th Percentile response time is slow`});
	}

	if(metrics.responseTime.median.status !== 'ok'){
		messages.push({status:metrics.responseTime.median.status, text: `Median response time is slow`});
	}

	return messages;
}

function getNodeStatus(node, info, metrics){
	debug('getNodeStatus', node.url);
	return co(function* (){
		const status = {
			region: node.region,
			url: node.url,
			name: node.url.replace(/https?:\/\//, '').replace('.herokuapp.com', '')
		};

		const gtgPing = yield ping(`${node.url}/__gtg`);
		status.up = gtgPing.result;
		status.health = yield health(node.url);

		status.scale = {
			initial: {size: Case.capital(info.formation.web.size), quantity: info.formation.web.scale},
			current: node.currentFormation
		};

		status.messages = getNodeStatusMessages(status, metrics);

		debug('status', status);
		return status;
	});
}

module.exports = function getAppStatus(info, metrics){
	return co(function* (){
		const status = {nodes: [], messages:[]};
		debug('getAppStatus', info);
		for(let i=0, l=info.nodes.length; i<l; i++){
			const node = info.nodes[i];
			const nodeStatus = yield getNodeStatus(node, info, metrics.nodes[i].metrics);
			for(let message of nodeStatus.messages){
				status.messages.push(Object.assign({}, message, {region:Case.upper(node.region)}));
			}

			status.nodes.push(nodeStatus);
		}

		status.messages.sort((a, b) => {
			if(a.status === b.status){
				return 0;
			}

			if(a.status === 'error'){
				return -1;
			}

			if(a.status === 'problem'){
				return 1;
			}

			if(a.status === 'warning'){
				return b.status === 'error' ? 1 : -1;
			}
		});

		status.up = status.nodes.every(n => n.up);
		status.healthy = status.nodes.every(n => n.health.overall);
		status.healthStatus = status.healthy ?
			'ok' :
			status.nodes.reduce((previous, current) => {
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
