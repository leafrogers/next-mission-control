const express = require('@financial-times/n-express');
const path = require('path');
const registry = require('./lib/registry');

process.on('uncaughtException', err => {
	console.error(err.stack);
	process.exit(1);
});

const controllers = {
	home: require('./controllers/home'),
	app: require('./controllers/app'),
	apiV1: require('./controllers/api-v1')
};

const middleware = {
	auth: require('./middleware/app-auth')
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

app.use('/api/v1', controllers.apiV1);

app.use('/', middleware.auth);
app.use('/:app', middleware.auth);

app.get('/', controllers.home);

app.get('/:app', controllers.app);

registry.init()
	.then(() => app.listen(PORT));
