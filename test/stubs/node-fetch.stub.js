
const sinon = require('sinon');

class MockResponse{

	constructor(data){
		this.ok = true;
		this.status = 200;
		this._data = data;
	}

	json(){
		return Promise.resolve(this._data);
	}
}

let stub = sinon.stub();

const setup = data => stub.returns(Promise.resolve(new MockResponse(data)));

const reset = () => stub.reset();

module.exports = {stub, setup, reset};
