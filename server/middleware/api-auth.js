const s3o = require('s3o-middleware');

module.exports = (req, res, next) => {
	s3o.authS3ONoRedirect(req, res, next);
};
