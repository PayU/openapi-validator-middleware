const getRequestFiles = require('../utils/requestFilesExtractor');

function getValidator(validateRequest) {
    return function validate(req, res, next) {
        const requestOptions = _getParameters(req);
        const errors = validateRequest(requestOptions);
        next(errors);
    };
}

function _getParameters(req) {
    const requestOptions = {};
    const path = req.baseUrl.concat(req.route.path);
    requestOptions.path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
    requestOptions.headers = req.headers;
    requestOptions.params = req.params;
    requestOptions.query = req.query;
    requestOptions.method = req.method;
    requestOptions.body = req.body;
    requestOptions.files = getRequestFiles(req);

    return requestOptions;
}

module.exports = { getValidator };
