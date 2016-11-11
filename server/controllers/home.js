const config = require('../lib/config')();
const registry = require('../lib/registry');


module.exports = (req, res) => {
	const mainApps = config.apps;
	const mainAppNames = mainApps.map(a => a.name);
	const otherApps = registry.getData()
		.filter(app => mainAppNames.includes(app.name) === false)
		.sort((a, b) => a.name.localeCompare(b.name));
	const viewModel = {
		layout: 'default',
		mainApps,
		otherApps
	};

	res.render('home', viewModel);
};
