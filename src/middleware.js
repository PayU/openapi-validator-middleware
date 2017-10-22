'use strict';

var SwaggerParser = require('swagger-parser'),
    Ajv = require('ajv'),
    Parser = require('swagger-parameters');

var schemas = {};
var middlewareOptions;
/**
 * Initialize the input validation middleware
 * @param {string} swaggerPath - the path for the swagger file
 * @param {Object} options - options.formats to add formats to ajv, options.beautifyErrors, options.firstError
 */
function init(swaggerPath, options) {
    middlewareOptions = options || {};
    console.log(JSON.stringify(options));
    console.log(JSON.stringify(middlewareOptions));
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
    let path = extractPath(req);
    return Promise.all([
        _validateParams(req.headers, req.params, req.query, path, req.method.toLowerCase()).catch(e => e),
        _validateBody(req.body, path, req.method.toLowerCase()).catch(e => e)
    ]).then(function (errors) {
        if (errors[0] || errors[1]) {
            return errors[0] && errors[1] ? Promise.reject(errors[0].concat(errors[1])) : errors[0] ? Promise.reject(errors[0]) : Promise.reject(errors[1]);
        }
        return next();
    }).catch(function (errors) {
        console.log(JSON.stringify(middlewareOptions));
        console.log(middlewareOptions.beautifyErrors && middlewareOptions.firstError);
        console.log(middlewareOptions.beautifyErrors);
        if (middlewareOptions.beautifyErrors && middlewareOptions.firstError) {
            errors = parseAjvError(errors[0]);
        } else if (middlewareOptions.beautifyErrors) {
            errors = parseAjvErrors(errors);
        }

        return next(new InputValidationError(errors));
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

function parseAjvErrors(errors) {
    var parsedError = [];
    errors.forEach(function(error) {
        parsedError.push(parseAjvError(error));
    }, this);

    return parsedError;
}

function parseAjvError(error) {
    if (error.dataPath.startsWith('.')) {
        error.dataPath = error.dataPath.replace('.', 'body/');
    }

    if (error.dataPath.startsWith('[')) {
        error.dataPath = 'body/' + error.dataPath;
    }

    if ((error.dataPath.startsWith('/')) || (error.dataPath.startsWith('\\'))) {
        error.dataPath = error.dataPath.replace('\\', '').replace('/', '');
    }

    if (error.dataPath === '') {
        error.dataPath = 'body';
    }

    if (error.keyword === 'enum') {
        error.message += ' [' + error.params.allowedValues.toString() + ']';
    }

    return error.dataPath + ' ' + error.message;
}

function addFormats(ajv, formats) {
    formats.forEach(function(format) {
        ajv.addFormat(format.name, format.pattern);
    });
}

function extractPath(req) {
    let path = req.baseUrl.concat(req.route.path);
    return path.endsWith('/') ? path.substring(0, path.length - 1) : path;
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