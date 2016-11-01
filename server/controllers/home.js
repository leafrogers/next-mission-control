
module.exports = (req, res) => {
	const viewModel = {
		layout: 'default'
	};

	res.render('home', viewModel);
};
