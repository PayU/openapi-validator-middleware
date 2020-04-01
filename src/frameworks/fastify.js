function validate(validateRequest) {
    return (request, reply) => {
        const requestOptions = _getParameters(request);
        return validateRequest(requestOptions).then(function (errors) {
            if (errors) {
                throw errors;
            }
        });
    };
}

function _getParameters(req) {
    const requestOptions = {};
    const path = req.raw.url;
    requestOptions.path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
    requestOptions.headers = req.headers;
    requestOptions.params = req.params;
    requestOptions.query = req.query;
    requestOptions.files = req.files;
    requestOptions.method = req.raw.method;
    requestOptions.body = req.body;

    return requestOptions;
}

function fastifyValidationPlugin(validateRequestFn) {
    const fp = require('fastify-plugin');

    return fp(function (fastify, options, next) {
        fastify.addHook('onRequest', validate(validateRequestFn));
        next();
    });
}

function getPlugins(validateRequestFn) {
    return {
        fastifyValidationPlugin: fastifyValidationPlugin(validateRequestFn)
    };
}

module.exports = {
    validate,
    getPlugins
};