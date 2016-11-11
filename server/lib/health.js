const fetch = require('node-fetch');
const co = require('co');
const log = require('@financial-times/n-logger').default;

class HealthResult{

	constructor(){
		this.hasHealthChecks = false;
		this.sevStatus = {
			sev1: true,
			sev2: true,
			sev3: true
		}
	}

	severityStatus(severity, value){
		const key = [`sev${severity}`];
		if(value !== undefined){
			this.sevStatus[key] = value
		}

		return this.sevStatus[key];
	}

	get overall(){
		return this.hasHealthChecks && this.sevStatus.sev1 && this.sevStatus.sev2 && this.sevStatus.sev3;
	}

	get status(){
		if(!this.hasHealthChecks){
			return 'problem';
		}

		if(!this.sevStatus.sev1){
			return 'error';
		}

		if(!this.sevStatus.sev2){
			return 'warning';
		}

		if(!this.sevStatus.sev3){
			return 'problem';
		}

		return 'ok';
	}

	get statusText(){
		if(!this.hasHealthChecks){
			return 'This app has no healthchecks';
		}

		if(this.status === 'ok'){
			return 'OK';
		}

		for(let sev of ['1','2','3']){
			if(!this.sevStatus[`sev${sev}`]){
				return `Healthchecks Failing: severity ${sev}`;
			}
		}
	}
}

function getHealthFor(hostname){
	const result = new HealthResult();
	return co(function* (){
		const response = yield fetch(`${hostname}/__health`);
		if(!response.ok){
			log.error({event:'NO_HEALTH_RESPONSE', hostname, status:response.status});
			return result;
		}

		const json = yield response.json();
		if(json.checks.length ===1 && json.checks[0].name == 'App has no healthchecks' && !json.checks[0].ok){
			return result;
		}

		result.hasHealthChecks = !!json.checks.length;

		result.severityStatus(1, true);
		result.severityStatus(2, true);
		result.severityStatus(3, true);


		for(let check of json.checks){
			if(!check.ok){
				result.severityStatus(check.severity, false);
			}
		}

		return result;
	});
}

module.exports = getHealthFor;
