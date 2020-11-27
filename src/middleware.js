'use strict';
const autoBind = require('auto-bind');
const SchemaEndpointResolver = require('./utils/schemaEndpointResolver');
const InputValidationError = require('./inputValidationError'),
    apiSchemaBuilder = require('api-schema-builder');
const allowedFrameworks = ['express', 'koa', 'fastify'];

class Middleware {
    constructor(swaggerPath, options) {
        this.schemas = {};
        this.middlewareOptions = undefined;
        this.framework = undefined;
        this.schemaEndpointResolver = undefined;
        this.validationMiddleware = undefined;
        this.InputValidationError = InputValidationError;
        if (swaggerPath){
            this.init(swaggerPath, options);
        }
        autoBind(this);
    }

    async initAsync(swaggerPath, options) {
        this._baseInit(options);
        // build schema for requests only
        const schemaBuilderOptions = Object.assign({}, options, { buildRequests: true, buildResponses: false });
        this.schemas = await apiSchemaBuilder.buildSchema(swaggerPath, schemaBuilderOptions);
    }

    init (swaggerPath, options) {
        this._baseInit(options);
        // build schema for requests only
        const schemaBuilderOptions = Object.assign({}, options, { buildRequests: true, buildResponses: false });
        this.schemas = apiSchemaBuilder.buildSchemaSync(swaggerPath, schemaBuilderOptions);
    }

    getNewMiddleware(swaggerPath, options) {
        return new Middleware(swaggerPath, options);
    }

    validate(...args) {
        return this.validationMiddleware(...args);
    }

    _baseInit (options) {
        this.middlewareOptions = options || {};
        const frameworkToLoad = allowedFrameworks.find((frameworkName) => {
            return this.middlewareOptions.framework === frameworkName;
        });

        this.framework = frameworkToLoad ? require(`./frameworks/${frameworkToLoad}`) : require('./frameworks/express');
        this.validationMiddleware = this.framework.getValidator((requestOptions) => this._validateRequest(requestOptions));
        this.schemaEndpointResolver = new SchemaEndpointResolver();
    }

    _getContentType (headers) {
        // This is to filter out things like charset
        const contentType = headers['content-type'];
        return contentType && contentType.split(';')[0].trim();
    }

    _validateRequest (requestOptions) {
        const paramValidationErrors = this._validateParams(requestOptions);
        const bodyValidationErrors = this._validateBody(requestOptions);

        const errors = paramValidationErrors.concat(bodyValidationErrors);

        if (errors.length) {
            let error;

            if (this.middlewareOptions.errorFormatter) {
                error = this.middlewareOptions.errorFormatter(errors, this.middlewareOptions);
            } else {
                error = new InputValidationError(errors,
                    {
                        beautifyErrors: this.middlewareOptions.beautifyErrors,
                        firstError: this.middlewareOptions.firstError
                    });
            }

            return error;
        }
    }

    _validateBody(requestOptions) {
        const { body, path } = requestOptions;
        const method = requestOptions.method.toLowerCase();
        const contentType = this._getContentType(requestOptions.headers);
        const methodSchema = this.schemaEndpointResolver.getMethodSchema(this.schemas, path, method) || {};

        if (methodSchema.body) {
            const validator = methodSchema.body[contentType] || methodSchema.body;
            if (!validator.validate(body)) {
                return validator.errors || [];
            }
        }

        return [];
    }

    _validateParams (requestOptions) {
        const { headers, params: pathParams, query, files, path } = requestOptions;
        const method = requestOptions.method.toLowerCase();

        const methodSchema = this.schemaEndpointResolver.getMethodSchema(this.schemas, path, method);
        if (methodSchema && methodSchema.parameters && !methodSchema.parameters.validate({ query: query, headers: headers, path: pathParams, files: files })) {
            return methodSchema.parameters.errors || [];
        }

        return [];
    }
}

module.exports = new Middleware();
