'use strict';

const pathToRegexp = require('path-to-regexp');
var InputValidationError = require('./inputValidationError'),
    apiSchemaBuilder = require('api-schema-builder');

var schemas = {};
var middlewareOptions;
var framework;
let pathObjects;

const buildPathObjects = (schema) => schema.map(([path, pathDef]) => {
    return {
        definition: pathDef,
        original: ['paths', path],
        regexp: pathToRegexp(path.replace(/\{/g, ':').replace(/\}/g, '')),
        path,
        pathDef
    };
});

function init(swaggerPath, options) {
    middlewareOptions = options || {};
    var allowedFrameworks = ['express', 'koa'];
    var frameworkToLoad = allowedFrameworks.find(function (frameworkName) {
        return middlewareOptions.framework === frameworkName;
    });

    framework = frameworkToLoad ? require(`./frameworks/${frameworkToLoad}`) : require('./frameworks/express');

    // build schema for requests only
    let schemaBuilderOptions = Object.assign({}, options, {buildRequests: true, buildResponses: false});
    return apiSchemaBuilder.buildSchema(swaggerPath, schemaBuilderOptions).then((receivedSchemas) => {
        schemas = receivedSchemas;
        pathObjects = buildPathObjects(Object.entries(schemas));
    });
}

function validate(...args) {
    return framework.validate(schemas, pathObjects, _validateRequest, ...args);
}

function _validateRequest(requestOptions) {
    return Promise.all([
        _validateParams(requestOptions.headers, requestOptions.params, requestOptions.query, requestOptions.files, requestOptions.path, requestOptions.method.toLowerCase()).catch(e => e),
        _validateBody(requestOptions.body, requestOptions.path, requestOptions.method.toLowerCase()).catch(e => e)
    ]).then(function (errors) {
        if (errors[0] || errors[1]) {
            return errors[0] && errors[1] ? Promise.reject(errors[0].concat(errors[1])) : errors[0] ? Promise.reject(errors[0]) : Promise.reject(errors[1]);
        }
    }).catch(function (errors) {
        const error = new InputValidationError(errors,
            { beautifyErrors: middlewareOptions.beautifyErrors,
                firstError: middlewareOptions.firstError });
        return Promise.resolve(error);
    });
}

function _validateBody(body, path, method) {
    return new Promise(function (resolve, reject) {
        if (schemas[path] && schemas[path][method] && schemas[path][method].body && !schemas[path][method].body.validate(body)) {
            return reject(schemas[path][method].body.errors);
        }
        return resolve();
    });
}

function _validateParams(headers, pathParams, query, files, path, method) {
    return new Promise(function (resolve, reject) {
        if (schemas[path] && schemas[path][method] && schemas[path][method].parameters && !schemas[path][method].parameters.validate({ query: query, headers: headers, path: pathParams, files: files })) {
            return reject(schemas[path][method].parameters.errors);
        }

        return resolve();
    });
}

module.exports = {
    init: init,
    validate: validate,
    InputValidationError: InputValidationError
};
