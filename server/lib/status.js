const ping = require('./ping');
const co = require('co');
const debug = require('debug')('status');
const Case = require('case');

const severitytoStatusMap = new Map([
	['1', 'error'],
	['2', 'warning'],
	['3', 'problem']
]);

function getNodeStatusMessages(status, metrics){
	console.log(getNodeStatusMessages.name, metrics);
	const messages = [];
	if(!status.up){
		messages.push({status:'error', text:'App in not responding to /__gtg requests'})
	}

	if(metrics.errors.length){
		for(let error of metrics.errors){
			messages.push({status:'warning', text:`There have been ${error.count} ${error.title} errors in the last hour`})
		}
	}

	if(!status.health.overall){
		messages.push({status:status.health.status, text:'Healthchecks are failing'});
	}

	if(metrics.memory.average.status !== 'ok'){
		messages.push({status:metrics.memory.average.status, text: `Average memory usage is ${metrics.memory.average.percentage}% of available memory`});
	}

	if(metrics.memory.max.status !== 'ok'){
		messages.push({status:metrics.memory.max.status, text: `App memory usage peaked at ${metrics.memory.max.percentage}% of available memory`});
	}

	if(metrics.responseTime.p95.status !== 'ok'){
		messages.push({status:metrics.responseTime.p95.status, text: `95th Percentile response time above threshold`});
	}

	if(metrics.responseTime.median.status !== 'ok'){
		messages.push({status:metrics.responseTime.median.status, text: `Median response time above threshold`});
	}

	return messages;
}

function getNodeStatus(node, info, metrics){
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

		status.messages = getNodeStatusMessages(status, metrics);

		debug('status', status);
		return status;
	});
}

module.exports = function getAppStatus(info, metrics){
	console.log('metrics', metrics);
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
		info.nodes.forEach((node, index) => {

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
