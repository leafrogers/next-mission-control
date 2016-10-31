const Poller = require('ft-poller');

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
	name = name.replace('ft-next-', '');
	return allApps.find(a => a.name === name);
}

module.exports = {init, getData, getAppData};

