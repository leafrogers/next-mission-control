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
			nodeMetrics.metrics.errors = yield herokuMetrics.errors(node.id);
			nodeMetrics.metrics.memory = yield herokuMetrics.memory(node.id);
			metrics.nodes.push(nodeMetrics);
		}

		return metrics;

	}).catch(err => console.error(err.stack));
};
