const authS3O = require('s3o-middleware');

const auth = function (req, res, next) {
	res.unVaryAll();
	authS3O(req, res, next);
};

module.exports = auth;
