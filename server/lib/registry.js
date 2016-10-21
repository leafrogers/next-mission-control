const Poller = require('ft-poller');

let poller;

function init(){
	poller = new Poller({url:'http://next-registry.ft.com/'});
	return poller.start({initialRequest:true});
}

function getData(){
	return poller.getData();
}

module.exports = {init, getData};

