const getConfig = require('../lib/config');


module.exports = (req, res) => {
	const config = getConfig();
	const viewModel = {
		layout: 'default',
		apps: config.apps
	};

	res.render('home', viewModel);
};
