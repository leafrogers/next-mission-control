const getConfig = require('../lib/config');


module.exports = (req, res) => {
	console.log('HOME');
	const config = getConfig();
	const viewModel = {
		layout: 'default',
		apps: config.apps
	};

	res.render('home', viewModel);
};
