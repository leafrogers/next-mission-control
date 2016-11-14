const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const fetchStub = require('./stubs/node-fetch.stub');
const sinon = require('sinon');

describe.only('Pingdom Adaptor', () => {

	let pingdom;
	const pingdomID = '1748747';
	const fixture = require('./fixtures/pingdom-response.json');

	before(() => {
		pingdom = proxyquire('../server/lib/pingdom', {'node-fetch':fetchStub.stub});
	});

	afterEach(() => {
		fetchStub.reset();
	});

	it('Should be able to get the current status of a pingdom check, given the id', () => {
		fetchStub.setup(fixture);
		return pingdom.status(pingdomID)
			.then(result => {
				const url = fetchStub.stub.lastCall.args[0];
				const opts = fetchStub.stub.lastCall.args[1];
				const headers = opts.headers;
				expect(headers).to.have.property('Authorization');
				expect(headers).to.have.property('App-Key');
				expect(headers).to.have.property('Account-Email');
				expect(result.result).to.equal(fixture.results[0].status === 'up');
			})
	});

});
