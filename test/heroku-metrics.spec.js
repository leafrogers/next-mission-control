const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const fetchStub = require('./stubs/node-fetch.stub');

describe('Heroku Metrics API Client', () => {

	let metrics;

	before(() => {
		metrics = proxyquire('../server/lib/heroku-metrics', {'node-fetch':fetchStub.stub});
	});

	it('Should be able to get error metrics', () => {
		const fixture = require('./fixtures/error-metrics-response.json');
		fetchStub.setup(fixture);
		return metrics.errors('d057116e-e17f-42fe-be00-9cd212403652')
			.then(errors => {
				const expectedErrorCodes = Object.keys(fixture.data);
				expect(errors.map(e => e.code)).to.deep.equal(expectedErrorCodes);
				for(let code of expectedErrorCodes){
					const error = errors.find(e => e.code === code);
					expect(error).to.exist;
					const total = fixture.data[code].reduce((prev, current) => current ? prev + current : prev, 0);
					expect(error.count).to.equal(total);
					if(error.code === 'H12'){
						expect(error.title).to.equal('Request timeout');
					}
				}
			});
	});

});
