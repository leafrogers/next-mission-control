const herokuMetrics = require('./heroku-metrics');
const co = require('co');

module.exports = function getAppMetrics(appInfo){
	return co(function* (){
		const metrics = {
			nodes: []
		};

		for(let node of appInfo.nodes){
			const nodeMetrics = {
				region:node.region,
				metrics:{},
				herokuMetricsDashboardUrl: `https://dashboard.heroku.com/apps/${node.name}/metrics/web?starting=24-hours-ago`
			};
			nodeMetrics.metrics.errors = yield herokuMetrics.errors(node.name);
			nodeMetrics.metrics.memory = yield herokuMetrics.memory(node.name);
			nodeMetrics.metrics.responseTime = yield herokuMetrics.responseTime(node.name);
			nodeMetrics.metrics.responseStatus = yield herokuMetrics.responseStatus(node.name);
			nodeMetrics.metrics.load = yield herokuMetrics.load(node.name);
			metrics.nodes.push(nodeMetrics);
		}

		return metrics;

	}).catch(err => console.error(err.stack));
};
