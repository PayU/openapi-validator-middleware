const fp = require('fastify-plugin');
const getRequestFiles = require('../utils/requestFilesExtractor');

let urijs;

function getValidator(validateRequest) {
    try {
        urijs = require('uri-js');
    } catch (err) {
        throw new Error('Missing `uri-js` dependency. Please run "npm install uri-js" to use fastify plugin');
    }
    let skiplist = [];

    return (pluginOptions) => {
        if (pluginOptions && pluginOptions.skiplist) {
            skiplist = pluginOptions.skiplist.map((regexStr) => new RegExp(regexStr));
        }

        return fp(function (fastify, options, next) {
            fastify.addHook('preValidation', validate);
            next();
        });
    };

    function validate(request, reply) {
        const requestOptions = _getParameters(request);
        if (skiplist.some((skipListRegex) => {
            return skipListRegex.test(requestOptions.path);
        })) {
            return Promise.resolve();
        }

        const errors = validateRequest(requestOptions);
        if (errors) {
            return Promise.reject(errors);
        }
        return Promise.resolve();
    }

    function _getParameters(req) {
        const requestOptions = {};
        const path = resolveUrlData(req.headers, req.raw).path;
        requestOptions.path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
        requestOptions.headers = req.headers;
        requestOptions.params = req.params;
        requestOptions.query = req.query;
        requestOptions.files = getRequestFiles(req);
        requestOptions.method = req.raw.method;
        requestOptions.body = req.body;

        return requestOptions;
    }

    function resolveUrlData(headers, req) {
        const scheme = (headers[':scheme'] ? headers[':scheme'] + ':' : '') + '//';
        const host = headers[':authority'] || headers.host;
        const path = headers[':path'] || req.url;
        return urijs.parse(scheme + host + path);
    }
}

module.exports = { getValidator };
