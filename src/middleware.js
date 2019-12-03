'use strict';

const SchemaEndpointResolver = require('./utils/schemaEndpointResolver');

const InputValidationError = require('./inputValidationError'),
    apiSchemaBuilder = require('api-schema-builder');
const allowedFrameworks = ['express', 'koa'];

let schemas = {};
let middlewareOptions;
let framework;
let schemaEndpointResolver;

function init(swaggerPath, options) {
    middlewareOptions = options || {};
    const frameworkToLoad = allowedFrameworks.find((frameworkName) => {
        return middlewareOptions.framework === frameworkName;
    });

    framework = frameworkToLoad ? require(`./frameworks/${frameworkToLoad}`) : require('./frameworks/express');
    schemaEndpointResolver = new SchemaEndpointResolver();

    // build schema for requests only
    let schemaBuilderOptions = Object.assign({}, options, { buildRequests: true, buildResponses: false });
    schemas = apiSchemaBuilder.buildSchemaSync(swaggerPath, schemaBuilderOptions);
}

function validate(...args) {
    return framework.validate(_validateRequest, ...args);
}

function _validateRequest(requestOptions) {
    return Promise.all([
        _validateParams(requestOptions.headers, requestOptions.params, requestOptions.query, requestOptions.files, requestOptions.path, requestOptions.method.toLowerCase()).catch(e => e),
        _validateBody(requestOptions.body, requestOptions.path, requestOptions.method.toLowerCase(), requestOptions.headers['content-type']).catch(e => e)
    ]).then(function (errors) {
        if (errors[0] || errors[1]) {
            return errors[0] && errors[1] ? Promise.reject(errors[0].concat(errors[1])) : errors[0] ? Promise.reject(errors[0]) : Promise.reject(errors[1]);
        }
    }).catch(function (errors) {
        let error;

        if (middlewareOptions.errorFormatter) {
            error = middlewareOptions.errorFormatter(errors, middlewareOptions);
        } else {
            error = new InputValidationError(errors,
                { beautifyErrors: middlewareOptions.beautifyErrors,
                    firstError: middlewareOptions.firstError });
        }

        return Promise.resolve(error);
    });
}

function _validateBody(body, path, method, contentType) {
    return new Promise(function (resolve, reject) {
        const methodSchema = schemaEndpointResolver.getMethodSchema(schemas, path, method) || {};

        if (methodSchema.body) {
            const validator = methodSchema.body[contentType] || methodSchema.body;
            if (!validator.validate(body)) {
                return reject(validator.errors);
            }
        }
        return resolve();
    });
}

function _validateParams(headers, pathParams, query, files, path, method) {
    return new Promise(function (resolve, reject) {
        const methodSchema = schemaEndpointResolver.getMethodSchema(schemas, path, method);
        if (methodSchema && methodSchema.parameters && !methodSchema.parameters.validate({ query: query, headers: headers, path: pathParams, files: files })) {
            return reject(methodSchema.parameters.errors);
        }

        return resolve();
    });
}

module.exports = {
    init,
    validate,
    InputValidationError
};
