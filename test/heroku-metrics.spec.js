const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const fetchStub = require('./stubs/node-fetch.stub');

describe('Heroku Metrics API Client', () => {

	let metrics;

	function total(arr){
		return arr.reduce((p, c) => p+c, 0);
	}

	function average(arr){
		return Math.floor( total(arr) / arr.length);
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
	});

	it('Should be able to get response time metrics', () => {
		const fixture = require('./fixtures/response-time.json');
		fetchStub.setup(fixture);
		return metrics.responseTime('d057116e-e17f-42fe-be00-9cd212403652')
			.then(responseTime => {
				const expectedMedian = average(fixture.data.latency_p50);
				const expected95th = average(fixture.data.latency_p95);
				expect(responseTime.rawData).to.exist;
				expect(responseTime.median.value).to.equal(expectedMedian);
				expect(responseTime.p95.value).to.equal(expected95th);
				expect(responseTime.p95.status).to.equal('ok');
			});
	});

	it('Should be able to get request and reponse status metrics', () => {
		const fixture = require('./fixtures/response-status.json');
		fetchStub.setup(fixture);
		return metrics.responseStatus('d057116e-e17f-42fe-be00-9cd212403652')
			.then(responseStatus => {
				const expectedStatuses = Object.keys(fixture.data);
				const expectedValues = expectedStatuses.map(s => average(fixture.data[s]));
				expect(responseStatus.rawData).to.exist;
				expect(responseStatus.total).to.equal(total(expectedValues));
				expectedStatuses.forEach((status, i) => {
					const val = responseStatus.list.find(r => r.code === status);
					expect(val).to.exist;
					expect(val.value).to.equal(expectedValues[i]);
				})
			});
	})


});
