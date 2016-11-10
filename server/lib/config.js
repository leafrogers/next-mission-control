const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const configFiles = new Map();

configFiles.set('thresholds', path.resolve(__dirname, '../../config/thresholds.yaml'));
configFiles.set('apps', path.resolve(__dirname, '../../config/apps.yaml'));

let configData;

function config(){
	if(!configData){
		let yamlData = [];
		for(let [name, filePath] of configFiles){
			yamlData.push(fs.readFileSync(filePath, {encoding:'utf8'}));
		}

		configData =  yaml.safeLoad(yamlData.join('\n'));
	}

	return JSON.parse(JSON.stringify(configData));
}

module.exports = config;
