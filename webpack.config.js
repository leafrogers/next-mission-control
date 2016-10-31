/* global __dirname */

var path = require('path');

var webpack = require('webpack');

var dir_js = path.resolve(__dirname, 'client');
var dir_build = path.resolve(__dirname, 'public');

module.exports = {
	entry: path.resolve(dir_js, 'main.js'),
	output: {
		path: dir_build,
		filename: 'main.js'
	},
	module: {
		loaders: [
			{
				loader: 'babel-loader',
				test: dir_js
			}
		]
	},
	stats: {
		// Nice colored output
		colors: true
	},
	// Create Sourcemaps for the bundle
	devtool: 'source-map'
};
