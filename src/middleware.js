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
    _baseInit(swaggerPath, options);
    // build schema for requests only
    const schemaBuilderOptions = Object.assign({}, options, { buildRequests: true, buildResponses: false });
    schemas = apiSchemaBuilder.buildSchemaSync(swaggerPath, schemaBuilderOptions);
}

async function initAsync(swaggerPath, options){
    _baseInit(swaggerPath, options);
    // build schema for requests only
    const schemaBuilderOptions = Object.assign({}, options, { buildRequests: true, buildResponses: false });
    schemas = await apiSchemaBuilder.buildSchema(swaggerPath, schemaBuilderOptions);
}

function validate(...args) {
    return validationMiddleware(...args);
}

function _baseInit(swaggerPath, options) {
    middlewareOptions = options || {};
    const frameworkToLoad = allowedFrameworks.find((frameworkName) => {
        return middlewareOptions.framework === frameworkName;
    });

    framework = frameworkToLoad ? require(`./frameworks/${frameworkToLoad}`) : require('./frameworks/express');
    validationMiddleware = framework.getValidator(_validateRequest);
    schemaEndpointResolver = new SchemaEndpointResolver();
}

function _getContentType(headers) {
    // This is to filter out things like charset
    const contentType = headers['content-type'];
    return contentType && contentType.split(';')[0].trim();
}

function _validateRequest(requestOptions) {
    const paramValidationErrors = _validateParams(requestOptions);
    const bodyValidationErrors = _validateBody(requestOptions);

    const errors = paramValidationErrors.concat(bodyValidationErrors);

    if (errors.length) {
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

function _validateBody(requestOptions) {
    const { body, path } = requestOptions;
    const method = requestOptions.method.toLowerCase();
    const contentType = _getContentType(requestOptions.headers);
    const methodSchema = schemaEndpointResolver.getMethodSchema(schemas, path, method) || {};

    if (methodSchema.body) {
        const validator = methodSchema.body[contentType] || methodSchema.body;
        if (!validator.validate(body)) {
            return validator.errors || [];
        }
    }

    return [];
}

function _validateParams(requestOptions) {
    const { headers, params: pathParams, query, files, path } = requestOptions;
    const method = requestOptions.method.toLowerCase();

    const methodSchema = schemaEndpointResolver.getMethodSchema(schemas, path, method);
    if (methodSchema && methodSchema.parameters && !methodSchema.parameters.validate({ query: query, headers: headers, path: pathParams, files: files })) {
        return methodSchema.parameters.errors || [];
    }

    return [];
}

module.exports = {
    init,
    initAsync,
    validate,
    InputValidationError
};
