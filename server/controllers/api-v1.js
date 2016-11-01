const express = require('@financial-times/n-express');
const router = express.Router();
const heroku = require('../lib/heroku');
const co = require('co');
const registry = require('../lib/registry');
const auth = require('../middleware/api-auth');

router.use((req, res, next) => {
	const requestersOrigin = req.get('origin');
	const isCorsRequest = requestersOrigin && /^(https?:\/\/)?((([^.]+)\.)*)ft\.com(:[0-9]{1,4})?$/.test(requestersOrigin);

	if(!isCorsRequest){
		return res.send(403);
	}

	if(isCorsRequest && req.method === 'OPTIONS') {
		res.send(200);
	} else {
		next();
	}
});

router.use(auth);

router.post('/scale/:name/:direction', (req, res) => {
	co(function* (){
		const appId = req.params.name;
		const currentFormation = yield heroku.getCurrentFormation(appId);
		const size = currentFormation.size;
		let quantity = currentFormation.quantity;
		if(req.params.direction === 'up'){
			quantity++
		}else if(req.params.direction === 'down'){
			quantity--;
		}

		yield heroku.scale(appId, quantity, size);
		res.sendStatus(200);

	}).catch(err => {
		console.error(err.stack);
		res.sendStatus(500)
	})
});

module.exports = router;
