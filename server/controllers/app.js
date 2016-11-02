const registry = require('../lib/registry');
const info = require('../lib/info');
const status = require('../lib/status');
const metrics = require('../lib/metrics');
const co = require('co');

module.exports = (req, res) => {
	co(function* (){
		const app = registry.getAppData(req.params.app);

		if(!app){
			return res.sendStatus(400);
		}

		const viewModel = {
			layout: 'default',
		};

		viewModel.info = yield info(app);
		viewModel.metrics = yield metrics(viewModel.info);
		viewModel.status = yield status(viewModel.info, viewModel.metrics);
		res.render('app', viewModel);
	});
};
