const co = require('co');

function $$(selector){
	return [].slice.apply(document.querySelectorAll(selector));
}

function getAppStatus(tr){
	const name = tr.dataset.appname;
	const statusContainer = tr.querySelector('.applist__status');
	statusContainer.className.split(' ').forEach(cls => {
		if(cls.includes('status--')){
			statusContainer.classList.remove(cls)
		}
	});
	removeMessages(name);
	statusContainer.classList.add('applist__status--waiting');
	return fetch(`/api/v1/status/${name}`, {credentials:'include'})
		.then(response => {
			if(!response.ok){
				throw new Error('Bad response: ' + response.status);
			}

			return response.json();
		})
		.then(json => {
			console.dir(json);
			statusContainer.classList.remove('applist__status--waiting');
			statusContainer.classList.add(`applist__status--${json.overall}`);
			for(let message of json.messages){
				addMessage(tr, message);
			}
		})
}

function removeMessages(name){
	document.querySelector(`tr.applist__messages[data-appname="${name}"] tbody`).innerHTML = '';
}

function addMessage(name, message){
	const container = document.querySelector(`tr.applist__messages[data-appname="${name}"] tbody`);
	const messageTr = document.createElement('tr');
	const messageTd = document.createElement('td');
	messageTd.setAttribute('colspan', '3');
	messageTr.classList.add('applist__message');
	messageTr.dataset.appname = tr.dataset.appname;
	messageTd.classList.add(`status--${message.status}`);
	messageTd.innerText = message.text + ` (${message.region})`;
	messageTr.appendChild(messageTd);
	container.appendChild(messageTr);
}

function init(){
	const rows = $$('tr[data-appname]').slice(0);
	return co(function* (){
		for(let row of rows){
			yield getAppStatus(row);
		}
	}).catch(err => console.error(err.stack));

}

module.exports = {init};
