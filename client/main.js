function $$(selector){
	return [].slice.apply(document.querySelectorAll(selector));
}


function scaleDynos(appName, direction){
	const buttons = $$('.status__node-actions button');
	buttons.forEach(button => {
		button.disabled = true;
	});
	const after = () => {
		buttons.forEach(button => {
			button.disabled = false;
		});
	};
	fetch(
		`/api/v1/scale/${appName}/${direction}`,
		{
			method: 'POST',
			credentials: 'same-origin'
		}
	).then(response => {
		if(!response.ok){
			alert('Failed to scale dynos');
		}else{
			alert('Dynos scaled.  The registry has not been updated so this action will be undone on the next deploy');
		}

		after();
	}).catch(err => {
		alert(err.message);
		after();
	});
}

function onScaleUpClick(e){
	const appName = e.target.dataset.appId;
	scaleDynos(appName, 'up');
}

function onScaleDownClick(e){
	const appName = e.target.dataset.appId;
	scaleDynos(appName, 'down');
}

function init(){
	document.getElementById('js-node-scale-down').addEventListener('click', onScaleDownClick);
	document.getElementById('js-node-scale-up').addEventListener('click', onScaleUpClick);
}

init();
