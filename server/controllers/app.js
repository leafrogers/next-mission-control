const registry = require('../lib/registry');
const info = require('../lib/info');
const status = require('../lib/status');
const co = require('co');

module.exports = (req, res) => {
	co(function* (){
		const app = registry.getAppData(req.params.app);

		if(!app){
			return res.sendStatus(400);
		}

		const viewModel = {
			layout: 'default',
			metrics: {}
		};

		viewModel.info = yield info(app);
		viewModel.status = yield status(viewModel.info);
		res.render('app', viewModel);
	});
};
