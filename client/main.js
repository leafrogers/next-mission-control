const LOADER_VISIBLE_CLASS = 'loading--visible';

function $$(selector){
	return [].slice.apply(document.querySelectorAll(selector));
}

function updateFormation(newformation){
	document.getElementById('js-current-scale-size').innerText = newformation.size;
	document.getElementById('js-current-scale-quantity').innerText = newformation.quantity;
}

function handleApiResponse(data){
	console.log(data);
	switch(data.action){
		case 'ALERT' :
			alert(data.message);
			break;
		case 'FORMATION_UPDATE':
			return updateFormation(data.newFormation);
	}
}


function doApiAction(button){
	const url = '/api/v1' + button.dataset.action;
	const method = button.dataset.method || 'GET';
	const loader = document.querySelector('.loading');
	const showLoader = () => loader.classList.add(LOADER_VISIBLE_CLASS);
	const hideLoader = () => loader.classList.remove(LOADER_VISIBLE_CLASS);
	button.blur();
	showLoader();
	fetch(url, {method, credentials:'include'})
		.then(response => {
			if(!response.ok){
				console.error('API Request failed', {status:response.status, url, method});
				hideLoader();
			}else{
				return response.json();
			}
		})
		.then(json => {
			handleApiResponse(json);
			hideLoader();
		})
		.catch(err => {
			console.error(err);
			hideLoader();
		})
}

function init(){
	$$('.js-api').forEach(button =>button.addEventListener('click', doApiAction.bind(null, button)))
}

init();
