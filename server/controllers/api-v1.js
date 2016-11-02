const express = require('@financial-times/n-express');
const router = express.Router();
const heroku = require('../lib/heroku');
const co = require('co');
const registry = require('../lib/registry');
const auth = require('../middleware/api-auth');

const DYNO_TYPES = [
	'standard-1x',
	'standard-2x',
	'performance-m',
	'performance-l'
];

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

router.post('/horizontal-scale/:direction/:name', (req, res) => {
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
		const newFormation = yield heroku.getCurrentFormation(appId);
		res.json({
			action: 'FORMATION_UPDATE',
			newFormation
		});

	}).catch(err => {
		console.error(err.stack);
		res.sendStatus(500)
	})
});

router.post('/vertical-scale/:direction/:name', (req, res) => {
	co(function* (){
		const appId = req.params.name;
		const currentFormation = yield heroku.getCurrentFormation(appId);
		const size = currentFormation.size;
		let quantity = currentFormation.quantity;
		const currentSizeIndex = DYNO_TYPES.indexOf(size.toLowerCase());
		if(currentSizeIndex === -1){
			throw new Error('Invalid size: ' + size);
		}

		let newSizeIndex;
		if(req.params.direction === 'up'){
			newSizeIndex = currentSizeIndex+1;
			if(newSizeIndex >= DYNO_TYPES.length){
				return res.json({
					action: 'ALERT',
					message: 'You are already using the biggest dyno type'
				})
			}
		}else if(req.params.direction === 'down'){
			newSizeIndex = currentSizeIndex-1;
			if(newSizeIndex < 0){
				return res.json({
					action: 'ALERT',
					message: 'You are already using the smallest dyno type'
				})
			}
		}

		const newSize = DYNO_TYPES[newSizeIndex];

		yield heroku.scale(appId, quantity, newSize);
		const newFormation = yield heroku.getCurrentFormation(appId);
		res.json({
			action: 'FORMATION_UPDATE',
			newFormation
		});

	}).catch(err => {
		console.error(err.stack);
		res.sendStatus(500)
	})
});

module.exports = router;
