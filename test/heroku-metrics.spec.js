const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const fetchStub = require('./stubs/node-fetch.stub');

describe('Heroku Metrics API Client', () => {

	let metrics;

	function average(arr){
		return Math.floor(arr.reduce((p, c) => p+c, 0) / arr.length);
	}

	function highest(arr){
		return Math.floor(arr.reduce((p, c) => c > p ? c : p, 0));
	}

	function percentage(number, perc){
		Math.floor((perc / 100) * number);
	}

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

	it('Should be able to get memory usage metrics', () => {
		const fixture = require('./fixtures/memory-usage-reponse.json');
		fetchStub.setup(fixture);
		return metrics.memory('d057116e-e17f-42fe-be00-9cd212403652')
			.then(memoryUsage => {
				const expectedAverage = average(fixture.data.memory_average);
				const expectedMax = highest(fixture.data.memory_total_max);
				const expectedMaxRss = highest(fixture.data.memory_max_rss);
				const quota = fixture.data.memory_quota[0];
				const expectedThresholds = {'error' : percentage(quota, 80), 'warning': percentage(quota, 70)};
				expect(memoryUsage.rawData).to.exist;
				expect(memoryUsage.average.value).to.equal(expectedAverage);
				expect(memoryUsage.max.value).to.equal(expectedMax);
				expect(memoryUsage.maxRss.value).to.equal(expectedMaxRss);
				expect(memoryUsage.average.status).to.equal('ok');
			});
	})


});
