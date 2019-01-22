'use strict';

var SwaggerParser = require('swagger-parser'),
    InputValidationError = require('./inputValidationError'),
    schemaPreprocessor = require('./utils/schema-preprocessor'),
    swagger3 = require('./swagger3'),
    swagger2 = require('./swagger2');
var schemas = {};
var middlewareOptions;

/**
 * Initialize the input validation middleware
 * @param {string} swaggerPath - the path for the swagger file
 * @param {Object} options - options.formats to add formats to ajv, options.beautifyErrors, options.firstError, options.expectFormFieldsInBody, options.fileNameField (default is 'fieldname' - multer package), options.ajvConfigBody and options.ajvConfigParams for config object that will be passed for creation of Ajv instance used for validation of body and parameters appropriately
 */
function init(swaggerPath, options) {
    middlewareOptions = options || {};
    const makeOptionalAttributesNullable = middlewareOptions.makeOptionalAttributesNullable || false;

    return Promise.all([
        SwaggerParser.dereference(swaggerPath),
        SwaggerParser.parse(swaggerPath)
    ]).then(function (swaggers) {
        const dereferenced = swaggers[0];
        Object.keys(dereferenced.paths).forEach(function (currentPath) {
            let pathParameters = dereferenced.paths[currentPath].parameters || [];
            let parsedPath = dereferenced.basePath && dereferenced.basePath !== '/' ? dereferenced.basePath.concat(currentPath.replace(/{/g, ':').replace(/}/g, '')) : currentPath.replace(/{/g, ':').replace(/}/g, '');
            schemas[parsedPath] = {};
            Object.keys(dereferenced.paths[currentPath]).filter(function (parameter) { return parameter !== 'parameters' })
                .forEach(function (currentMethod) {
                    schemas[parsedPath][currentMethod.toLowerCase()] = {};
                    const isOpenApi3 = dereferenced.openapi === '3.0.0';
                    const parameters = dereferenced.paths[currentPath][currentMethod].parameters || [];
                    if (isOpenApi3){
                        schemas[parsedPath][currentMethod].body = swagger3.buildV3BodyValidation(dereferenced, swaggers[1], currentPath, currentMethod, middlewareOptions);
                    } else {
                        let bodySchema = middlewareOptions.expectFormFieldsInBody
                            ? parameters.filter(function (parameter) { return (parameter.in === 'body' || (parameter.in === 'formData' && parameter.type !== 'file')) })
                            : parameters.filter(function (parameter) { return parameter.in === 'body' });
                        if (makeOptionalAttributesNullable) {
                            schemaPreprocessor.makeOptionalAttributesNullable(bodySchema);
                        }
                        if (bodySchema.length > 0) {
                            const validatedBodySchema = swagger2.getValidatedBodySchema(bodySchema);
                            schemas[parsedPath][currentMethod].body = swagger2.buildBodyValidation(validatedBodySchema, dereferenced.definitions, swaggers[1], currentPath, currentMethod, parsedPath, middlewareOptions);
                        }
                    }

                    let localParameters = parameters.filter(function (parameter) {
                        return parameter.in !== 'body';
                    }).concat(pathParameters);

                    if (localParameters.length > 0 || middlewareOptions.contentTypeValidation) {
                        schemas[parsedPath][currentMethod].parameters = swagger2.buildParametersValidation(localParameters,
                            dereferenced.paths[currentPath][currentMethod].consumes || dereferenced.paths[currentPath].consumes || dereferenced.consumes, middlewareOptions);
                    }
                });
        });
    })
        .catch(function (error) {
            return Promise.reject(error);
        });
}
/**
 * The middleware - should be called for each express route
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns In case of an error will call `next` with `InputValidationError`
 */
function validate(req, res, next) {
    let path = extractPath(req);

    return Promise.all([
        _validateParams(req.headers, req.params, req.query, req.files, path, req.method.toLowerCase()).catch(e => e),
        _validateBody(req.body, path, req.method.toLowerCase()).catch(e => e)
    ]).then(function (errors) {
        if (errors[0] || errors[1]) {
            return errors[0] && errors[1] ? Promise.reject(errors[0].concat(errors[1])) : errors[0] ? Promise.reject(errors[0]) : Promise.reject(errors[1]);
        }
        return next();
    }).catch(function (errors) {
        const error = new InputValidationError(errors, path, req.method.toLowerCase(),
            { beautifyErrors: middlewareOptions.beautifyErrors,
                firstError: middlewareOptions.firstError });
        return next(error);
    });
}

function _validateBody(body, path, method) {
    return new Promise(function (resolve, reject) {
        if (schemas[path][method].body && !schemas[path][method].body.validate(body)) {
            return reject(schemas[path][method].body.errors);
        }
        return resolve();
    });
}

function _validateParams(headers, pathParams, query, files, path, method) {
    return new Promise(function (resolve, reject) {
        if (schemas[path][method].parameters && !schemas[path][method].parameters({ query: query, headers: headers, path: pathParams, files: files })) {
            return reject(schemas[path][method].parameters.errors);
        }

        return resolve();
    });
}

function extractPath(req) {
    let path = req.baseUrl.concat(req.route.path);
    return path.endsWith('/') ? path.substring(0, path.length - 1) : path;
}

module.exports = {
    init: init,
    validate: validate,
    InputValidationError: InputValidationError
};
