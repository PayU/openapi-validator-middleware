const parseUrl = require('url').parse;

const matchUrlWithSchema = (reqUrl, schema, pathObjects) => {
    let url = parseUrl(reqUrl).pathname;
    if (schema.basePath) {
        url = url.replace(schema.basePath, '');
    }
    const pathObj = pathObjects.filter(obj => url.match(obj.regexp));
    let match = null;
    if (pathObj[0]) {
        match = pathObj[0].path;
    }
    return match;
};

function _getParameters(req, schema, pathObjects) {
    let requestOptions = {};

    const path = matchUrlWithSchema(req.originalUrl, schema, pathObjects);
    requestOptions.path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
    requestOptions.headers = req.headers;
    requestOptions.params = req.params;
    requestOptions.query = req.query;
    requestOptions.files = req.files;
    requestOptions.method = req.method;
    requestOptions.body = req.body;

    return requestOptions;
}

function validate(schema, pathObjects, validateRequest, req, res, next) {
    let requestOptions;
    requestOptions = _getParameters(req, schema, pathObjects);
    validateRequest(requestOptions).then(function(errors) {
        next(errors);
    });
}

module.exports = {
    validate: validate
};
