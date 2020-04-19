'use strict';

const SchemaEndpointResolver = require('./utils/schemaEndpointResolver');

const InputValidationError = require('./inputValidationError'),
    apiSchemaBuilder = require('api-schema-builder');
const allowedFrameworks = ['express', 'koa', 'fastify'];

let schemas = {};
let middlewareOptions;
let framework;
let schemaEndpointResolver;
let validationMiddleware;

function init(swaggerPath, options) {
    middlewareOptions = options || {};
    const frameworkToLoad = allowedFrameworks.find((frameworkName) => {
        return middlewareOptions.framework === frameworkName;
    });

    framework = frameworkToLoad ? require(`./frameworks/${frameworkToLoad}`) : require('./frameworks/express');
    validationMiddleware = framework.getValidator(_validateRequest);
    schemaEndpointResolver = new SchemaEndpointResolver();

    // build schema for requests only
    const schemaBuilderOptions = Object.assign({}, options, { buildRequests: true, buildResponses: false });
    schemas = apiSchemaBuilder.buildSchemaSync(swaggerPath, schemaBuilderOptions);
}

function validate(...args) {
    return validationMiddleware(...args);
}

function _getContentType(headers) {
    // This is to filter out things like charset
    const contentType = headers['content-type'];
    return contentType && contentType.split(';')[0].trim();
}

function _validateRequest(requestOptions) {
    const paramValidationErrors = _validateParams(requestOptions.headers, requestOptions.params, requestOptions.query, requestOptions.files, requestOptions.path, requestOptions.method.toLowerCase());
    const bodyValidationErrors = _validateBody(requestOptions.body, requestOptions.path, requestOptions.method.toLowerCase(), _getContentType(requestOptions.headers));

    const errors = paramValidationErrors && bodyValidationErrors
        ? paramValidationErrors.concat(bodyValidationErrors)
        : paramValidationErrors || bodyValidationErrors;

    if (errors) {
        let error;

        if (middlewareOptions.errorFormatter) {
            error = middlewareOptions.errorFormatter(errors, middlewareOptions);
        } else {
            error = new InputValidationError(errors,
                {
                    beautifyErrors: middlewareOptions.beautifyErrors,
                    firstError: middlewareOptions.firstError
                });
        }

        return error;
    }
}

function _validateBody(body, path, method, contentType) {
    const methodSchema = schemaEndpointResolver.getMethodSchema(schemas, path, method) || {};

    if (methodSchema.body) {
        const validator = methodSchema.body[contentType] || methodSchema.body;
        if (!validator.validate(body)) {
            return validator.errors;
        }
    }
}

function _validateParams(headers, pathParams, query, files, path, method) {
    const methodSchema = schemaEndpointResolver.getMethodSchema(schemas, path, method);
    if (methodSchema && methodSchema.parameters && !methodSchema.parameters.validate({ query: query, headers: headers, path: pathParams, files: files })) {
        return methodSchema.parameters.errors;
    }
}

module.exports = {
    init,
    validate,
    InputValidationError
};
