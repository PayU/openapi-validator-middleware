'use strict';

var SwaggerParser = require('swagger-parser'),
    Ajv = require('ajv'),
    Parser = require('swagger-parameters');

var schemas = {};

/**
 * Initialize the input validation middleware
 * @param {string} swaggerPath - the path for the swagger file
 * @param {Object} options - options.formats to add formats to ajv
 */
function init(swaggerPath, options) {
    return SwaggerParser.dereference(swaggerPath)
        .then(function (dereferenced) {
            Object.keys(dereferenced.paths).forEach(function(currentPath){
                let pathParameters = dereferenced.paths[currentPath].parameters || [];
                let parsedPath = currentPath.replace(/{/g, ':').replace(/}/g, '');
                schemas[parsedPath] = {};
                Object.keys(dereferenced.paths[currentPath]).filter(function (parameter) { return parameter !== 'parameters' })
                    .forEach(function(currentMethod) {
                        schemas[parsedPath][currentMethod.toLowerCase()] = {};
                        let ajv = new Ajv({
                            allErrors: true
                        });

                        if (options && options.formats) {
                            addFormats(ajv, options.formats);
                        }

                        let bodySchema = dereferenced.paths[currentPath][currentMethod].parameters.filter(function(parameter) { return parameter.in === 'body' });
                        if (bodySchema.length > 0) {
                            schemas[parsedPath][currentMethod].body = ajv.compile(bodySchema[0].schema);
                        }

                        let localParameters = dereferenced.paths[currentPath][currentMethod].parameters.filter(function(parameter) {
                            return parameter.in !== 'body';
                        }).concat(pathParameters);

                        if (localParameters.length > 0) {
                            schemas[parsedPath][currentMethod].parameters = Parser(localParameters);
                        }
                    });
            });
        })
        .catch(function (error) {
            return Promise.reject(error);
        });
};

/**
 * The middleware - should be called for each express route
 * @param {any} req 
 * @param {any} res 
 * @param {any} next 
 * @returns In case of an error will call `next` with `InputValidationError`
 */
function validate(req, res, next) {
    return Promise.all([
        _validateParams(req.headers, req.params, req.query, req.route.path, req.method.toLowerCase()),
        _validateBody(req.body, req.route.path, req.method.toLowerCase())
    ]).then(function () {
        return next();
    }).catch(function (error) {
        return next(new InputValidationError(error));
    });
};

function _validateBody(body, path, method) {
    return new Promise(function (resolve, reject) {
        if (schemas[path][method].body && !schemas[path][method].body(body)) {
            return reject(schemas[path][method].body.errors);
        }
        return resolve();
    });
}

function _validateParams(headers, pathParams, query, path, method) {
    return new Promise(function (resolve, reject) {
        if (schemas[path][method].parameters) {
            schemas[path][method].parameters({
                query: query,
                headers: headers,
                path: pathParams
            }, function (err, data) {
                if (err) {
                    return reject(err.errors);
                }
                return resolve();
            });
        }

        return resolve();
    });
}

function addFormats(ajv, formats) {
    formats.forEach(function(format) {
        ajv.addFormat(format.name, format.pattern);
    });
}

/**
 * Represent an input validation error
 * errors field will include the `ajv` error
 * @class InputValidationError
 * @extends {Error}
 */
class InputValidationError extends Error {
    constructor(errors, place, message) {
        super(message);
        this.errors = errors;
    }
}

module.exports = {
    init: init,
    validate: validate,
    InputValidationError: InputValidationError
};