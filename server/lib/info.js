const Case = require('case');
const heroku = require('../lib/heroku');
const co = require('co');

module.exports = function getAppInfo(app){
	return co(function* (){
		const info = {
			name: app.name,
			title: Case.title(app.name),
			desc: app.desc,
			serves: app.serves.join(', '),
			tier: app.tier,
			repo: app.versions['1'].repo,
			heroku: app.versions['1'].dashboard,
			nodes: app.versions['1'].nodes
		};

		for(node of info.nodes){
			const herokuInfo = yield heroku.getAppInfo(node.url.replace(/https?:\/\//, '').replace('.herokuapp.com', ''));
			node.id = herokuInfo.id;
			node.name = herokuInfo.name;
		}

		return info;
	}).catch(err => console.error(err.stack));
};
