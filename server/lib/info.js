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

			if(process.env.USE_PINGDOM && app.versions['1'].checks && app.versions['1'].checks.availability && app.versions['1'].checks.availability[i]){
				node.pingdomId = app.versions['1'].checks.availability[i];
			}

			const appId = node.url.replace(/https?:\/\//, '').replace('.herokuapp.com', '');
			const [herokuInfo, releases] = yield Promise.all([
				heroku.getAppInfo(appId),
				heroku.releases(appId)
			]);

			for(let release of releases){
				release.commitUrl = release.description.includes('Deploy') ?  info.repo + '/commit/' + release.hash : null;
			}

			node.id = herokuInfo.id;
			node.name = herokuInfo.name;
			node.currentFormation = yield heroku.getCurrentFormation(node.id);
			node.releases = releases;
			info.nodes[i] = node;
		}

		info.releases = [];
		for(let i=0, l=info.nodes[0].releases.length; i<l; i++){
			info.releases.push({
				versions : info.nodes.map(node => node.releases[i].version).join('/'),
				ids: info.nodes.map(node => node.releases[i].id),
				description: info.nodes[0].releases[i].description,
				date: info.nodes[0].releases[i].date,
				commitUrl: info.nodes[0].releases[i].commitUrl,
				hash: info.nodes[0].releases[i].hash,
				rollbackUrl: '/rollback/' + info.nodes.map(n => `${n.name}:${n.releases[i].id}`).join(',')
			})
		}

		return info;
	});
};
