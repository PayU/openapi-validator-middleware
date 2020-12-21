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
    requestOptions.files = req.files;
    requestOptions.method = req.method;
    requestOptions.body = req.body;
    if (req.file || req.files) {
        const files = req.files ? req.files : []
        requestOptions.files = [req.file, ...files];
    }

    return requestOptions;
}

module.exports = { getValidator };
