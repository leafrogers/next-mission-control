const herokuMetrics = require('./heroku-metrics');
const co = require('co');

module.exports = function getAppMetrics(appInfo){
	return co(function* (){
		const metrics = {
			nodes: []
		};

		for(let node of appInfo.nodes){
			console.log('node', node);
			const nodeMetrics = {
				region:node.region,
				herokuMetricsDashboardUrl: `https://dashboard.heroku.com/apps/${node.name}/metrics/web?starting=24-hours-ago`
			};

			const [errors, memory, responseTime, responseStatus, load] = yield Promise.all([
				herokuMetrics.errors(node.name),
				herokuMetrics.memory(node.name),
				herokuMetrics.responseTime(node.name),
				herokuMetrics.responseStatus(node.name),
				herokuMetrics.load(node.name)
			]);

			nodeMetrics.metrics = {errors, memory, responseTime, responseStatus, load};
			metrics.nodes.push(nodeMetrics);
		}

		return metrics;

	}).catch(err => console.error(err.stack));
};
