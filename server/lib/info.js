const Case = require('case');

module.exports = function getAppInfo(app){
	return {
		name: app.name,
		title: Case.title(app.name),
		desc: app.desc,
		serves: app.serves.join(', '),
		tier: app.tier,
		repo: app.versions['1'].repo,
		heroku: app.versions['1'].dashboard,
		nodes: app.versions['1'].nodes
	}
};
