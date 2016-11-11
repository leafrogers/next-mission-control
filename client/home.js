const co = require('co');

function $$(selector){
	return [].slice.apply(document.querySelectorAll(selector));
}

function getAppStatus(itemNode){
	const name = itemNode.dataset.appname;
	const statusContainer = itemNode.querySelector('.applist__status');
	statusContainer.className.split(' ').forEach(cls => {
		if(cls.includes('status--')){
			statusContainer.classList.remove(cls)
		}
	});
	removeMessages(itemNode);
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
			if(json.messages.length){
				itemNode.querySelector('.applist__messages').classList.add('visible');
			}
			for(let message of json.messages){
				addMessage(itemNode, message);
			}
		})
}

function removeMessages(itemNode){
	const messages = itemNode.querySelector('.applist__messages');
	messages.innerHTML = '';
	messages.classList.remove('visible');
}

function addMessage(itemNode, message){
	const li = document.createElement('li');
	li.classList.add('applist__message', `status--${message.status}`);
	li.dataset.appname = name;
	li.innerText = `${message.text} (${message.region})`;
	itemNode.querySelector('.applist__messages').appendChild(li);
}

function init(){
	const rows = $$('.applist--main .applist__item[data-appname]');
	return co(function* (){
		for(let row of rows){
			yield getAppStatus(row);
		}
	}).catch(err => console.error(err.stack));

}

module.exports = {init};
