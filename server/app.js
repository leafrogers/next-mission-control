const express = require('@financial-times/n-express');
const path = require('path');
const registry = require('./lib/registry');

const controllers = {
	home: require('./controllers/home'),
	app: require('./controllers/app'),
	apiV1: require('./controllers/api-v1')
};

const PORT = Number(process.env.PORT || 3002);

const app = express({
	withHandlebars:true,
	layoutsDir: path.resolve(__dirname, '../views/layout/'),
	withAssets:true
});

app.use(express.static('public'));

app.get('/__gtg', (req, res) => {
	res.sendStatus(200).end();
});

app.get('/', controllers.home);

app.get('/:app', controllers.app);

app.use('/api/v1', controllers.apiV1);

registry.init()
	.then(() => app.listen(PORT));
