const Poller = require('ft-poller');
const log = require('@financial-times/n-logger').default;

let poller;

function init(){
	poller = new Poller({url:'http://next-registry.ft.com/'});
	return poller.start({initialRequest:true});
}

function getData(){
	return poller.getData();
}

function getAppData(name){
	const allApps = getData();
	name = name.replace('ft-next-', '').replace('-v003', '').replace(/(-eu|-us)/, '');
	return allApps.find(a => a.name === name);
}

function getAppScaleData(name){
	const app = getAppData(name);
	log.error({event:'NO_APP_FOUND_IN_REGISTRY', name});
	const scale = app.versions['1'].processes.web;
	return {
		size: scale.size,
		quantity: scale.scale
	}
}

module.exports = {init, getData, getAppData, getAppScaleData};
