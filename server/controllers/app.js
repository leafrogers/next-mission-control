const registry = require('../lib/registry');
const Case = require('case');

module.exports = (req, res) => {
	const registryData = registry.getData();

	const app = registryData.find(d => d.name === req.params.app);

	if(!app){
		return res.sendStatus(400);
	}

	const viewModel = {
		layout: 'default',

		name: app.name,
		title: Case.title(app.name),
		desc: app.desc,
		serves: app.serves.join(', '),
		tier: app.tier,
		repo: app.versions['1'].repo,
		heroku: app.versions['1'].dashboard,
		nodes: app.versions['1'].nodes
	};

	res.render('app', viewModel);
};
