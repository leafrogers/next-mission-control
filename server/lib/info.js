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
			nodes: app.versions['1'].nodes,
			formation: app.versions['1'].processes,
		};

		for(let i = 0, l = info.nodes.length; i<l; i++){
			let node = info.nodes[i];
			if(typeof node === 'string'){
				node = {url:node, region:'eu'};
			}

			if(app.versions['1'].checks && app.versions['1'].checks.availability && app.versions['1'].checks.availability[i]){
				node.pingdomId = app.versions['1'].checks.availability[i];
			}

			const herokuInfo = yield heroku.getAppInfo(node.url.replace(/https?:\/\//, '').replace('.herokuapp.com', ''));
			node.id = herokuInfo.id;
			node.name = herokuInfo.name;
			node.currentFormation = yield heroku.getCurrentFormation(node.id);
			info.nodes[i] = node;
		}

		return info;
	}).catch(err => console.error(err.stack));
};
