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
				herokuMetricsDashboardUrl: `https://dashboard.heroku.com/apps/${node.name}/metrics/web?starting=24-hours-ago`
			};

			const [errors, memory, responseTime, responseStatus, load] = yield Promise.all([
				herokuMetrics.errors(node.id),
				herokuMetrics.memory(node.id),
				herokuMetrics.responseTime(node.id),
				herokuMetrics.responseStatus(node.id),
				herokuMetrics.load(node.id)
			]);

			nodeMetrics.metrics = {errors, memory, responseTime, responseStatus, load};
			metrics.nodes.push(nodeMetrics);
		}

		return metrics;

	}).catch(err => console.error(err.stack));
};
