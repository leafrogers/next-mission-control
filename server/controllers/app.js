const registry = require('../lib/registry');
const info = require('../lib/info');
const status = require('../lib/status');
const co = require('co');

module.exports = (req, res) => {
	co(function* (){
		const registryData = registry.getData();

		const app = registryData.find(d => d.name === req.params.app);

		if(!app){
			return res.sendStatus(400);
		}

		const viewModel = {
			layout: 'default',
			info: info(app),
			metrics: {}
		};

		viewModel.status = yield status(viewModel.info);
		res.render('app', viewModel);
	});
};
