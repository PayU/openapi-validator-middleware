'use strict'

var SwaggerParser = require('swagger-parser'),
  Ajv = require('ajv'),
  _ = require('lodash'),
  Validators = require('./validators')

var schemas = {}
var middlewareOptions

/**
 * Initialize the input validation middleware
 * @param {string} swaggerPath - the path for the swagger file
 * @param {Object} options - options.formats to add formats to ajv, options.beautifyErrors, options.firstError
 */
function init (swaggerPath, options) {
  middlewareOptions = options || {}
  return Promise.all([
    SwaggerParser.dereference(swaggerPath),
    SwaggerParser.parse(swaggerPath)
  ]).then(function (swaggers) {
    var dereferenced = swaggers[0]
    Object.keys(dereferenced.paths).forEach(function (currentPath) {
      let pathParameters = dereferenced.paths[currentPath].parameters || []
      let parsedPath;
      if (dereferenced.basePath !== '/') {
        parsedPath = dereferenced.basePath + currentPath.replace(/{/g, ':').replace(/}/g, '')
      } else {
        parsedPath = currentPath.replace(/{/g, ':').replace(/}/g, '')
      }
      console.log("parsedPath:" + parsedPath)
      schemas[parsedPath] = {}
      Object.keys(dereferenced.paths[currentPath]).filter(function (parameter) { return parameter !== 'parameters' })
        .forEach(function (currentMethod) {
          schemas[parsedPath][currentMethod.toLowerCase()] = {}

          const parameters = dereferenced.paths[currentPath][currentMethod].parameters || []
          let bodySchema = parameters.filter(function (parameter) { return parameter.in === 'body' })
          if (bodySchema.length > 0) {
            schemas[parsedPath][currentMethod].body = buildBodyValidation(bodySchema[0].schema, dereferenced.definitions, swaggers[1], currentPath, currentMethod, parsedPath)
          }

          let localParameters = parameters.filter(function (parameter) {
            return parameter.in !== 'body'
          }).concat(pathParameters)
          if (localParameters.length > 0) {
            schemas[parsedPath][currentMethod].parameters = buildParametersValidation(localParameters)
          }
        })
    })
  })
    .catch(function (error) {
      return Promise.reject(error)
    })
}

/**
 * The middleware - should be called for each express route
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns In case of an error will call `next` with `InputValidationError`
 */
function validate (req, res, next) {
  let path = extractPath(req)
  return Promise.all([
    _validateParams(req.headers, req.params, req.query, path, req.method.toLowerCase()).catch(e => e),
    _validateBody(req.body, path, req.method.toLowerCase()).catch(e => e)
  ]).then(function (errors) {
    if (errors[0] || errors[1]) {
      return errors[0] && errors[1] ? Promise.reject(errors[0].concat(errors[1])) : errors[0] ? Promise.reject(errors[0]) : Promise.reject(errors[1])
    }
    return next()
  }).catch(function (errors) {
    if (middlewareOptions.beautifyErrors && middlewareOptions.firstError) {
      errors = parseAjvError(errors[0], path, req.method.toLowerCase())
    } else if (middlewareOptions.beautifyErrors) {
      errors = parseAjvErrors(errors, path, req.method.toLowerCase())
    }

    return next(new InputValidationError(errors))
  })
}

function _validateBody (body, path, method) {
  return new Promise(function (resolve, reject) {
    if (schemas[path][method].body && !schemas[path][method].body.validate(body)) {
      return reject(schemas[path][method].body.errors)
    }
    return resolve()
  })
}

function _validateParams (headers, pathParams, query, path, method) {
  return new Promise(function (resolve, reject) {
    if (schemas[path][method].parameters && !schemas[path][method].parameters({
        query: query,
        headers: headers,
        path: pathParams
      })) {
      return reject(schemas[path][method].parameters.errors)
    }

    return resolve()
  })
}

function parseAjvErrors (errors, path, method) {
  var parsedError = []
  errors.forEach(function (error) {
    parsedError.push(parseAjvError(error, path, method))
  }, this)

  return parsedError
}

function parseAjvError (error, path, method) {
  if (error.dataPath.startsWith('.header')) {
    error.dataPath = error.dataPath.replace('.', '')
    error.dataPath = error.dataPath.replace('[', '/')
    error.dataPath = error.dataPath.replace(']', '')
    error.dataPath = error.dataPath.replace('\'', '')
    error.dataPath = error.dataPath.replace('\'', '')
  }

  if (error.dataPath.startsWith('.path')) {
    error.dataPath = error.dataPath.replace('.', '')
    error.dataPath = error.dataPath.replace('.', '/')
  }

  if (error.dataPath.startsWith('.query')) {
    error.dataPath = error.dataPath.replace('.', '')
    error.dataPath = error.dataPath.replace('.', '/')
  }

  if (error.dataPath.startsWith('.')) {
    error.dataPath = error.dataPath.replace('.', 'body/')
  }

  if (error.dataPath.startsWith('[')) {
    error.dataPath = 'body/' + error.dataPath
  }

  if (error.dataPath === '') {
    error.dataPath = 'body'
  }

  if (error.keyword === 'enum') {
    error.message += ' [' + error.params.allowedValues.toString() + ']'
  }

  return error.dataPath + ' ' + error.message
}

function addFormats (ajv, formats) {
  if (formats) {
    formats.forEach(function (format) {
      ajv.addFormat(format.name, format.pattern)
    })
  }
}

function extractPath (req) {
  let path = req.baseUrl.concat(req.route.path)
  return path.endsWith('/') ? path.substring(0, path.length - 1) : path
}

function buildBodyValidation (schema, swaggerDefinitions, originalSwagger, currentPath, currentMethod, parsedPath) {
  let ajv = new Ajv({
    allErrors: true
    // unknownFormats: 'ignore'
  })

  addFormats(ajv, middlewareOptions.formats)

  if (schema.discriminator) {
    return buildInheritance(schema.discriminator, swaggerDefinitions, originalSwagger, currentPath, currentMethod, parsedPath, ajv)
  } else {
    return new Validators.SimpleValidator(ajv.compile(schema))
  }
}

function buildInheritance (discriminator, dereferencedDefinitions, swagger, currentPath, currentMethod, parsedPath, ajv) {
  let bodySchema = swagger.paths[currentPath][currentMethod].parameters.filter(function (parameter) { return parameter.in === 'body' })[0]
  var inheritsObject = {
    inheritance: []
  }
  inheritsObject.discriminator = discriminator

  Object.keys(swagger.definitions).forEach(key => {
    if (swagger.definitions[key].allOf) {
      swagger.definitions[key].allOf.forEach(element => {
        if (element['$ref'] && element['$ref'] === bodySchema.schema['$ref']) {
          inheritsObject[key] = ajv.compile(dereferencedDefinitions[key])
          inheritsObject.inheritance.push(key)
        }
      })
    }
  }, this)

  return new Validators.OneOfValidator(inheritsObject)
}

function buildParametersValidation (parameters) {
  let ajv = new Ajv({
    allErrors: true,
    coerceTypes: 'array'
    // unknownFormats: 'ignore'
  })

  addFormats(ajv, middlewareOptions.formats)

  var ajvParametersSchema = {
    title: 'HTTP parameters',
    type: 'object',
    additionalProperties: false,
    properties: {
      headers: {
        title: 'HTTP headers',
        type: 'object',
        properties: {},
        additionalProperties: true
        // plural: 'headers'
      },
      path: {
        title: 'HTTP path',
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      query: {
        title: 'HTTP query',
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  }

  parameters.forEach(parameter => {
    var data = _.cloneDeep(parameter)

    const required = parameter.required
    const source = typeNameConversion[parameter.in] || parameter.in
    const key = parameter.name

    var destination = ajvParametersSchema.properties[source]

    delete data.name
    delete data.in
    delete data.required

    if (required) {
      destination.required = destination.required || []
      destination.required.push(key)
    }
    destination.properties[key] = data
  }, this)

  return ajv.compile(ajvParametersSchema)
}

/**
 * Represent an input validation error
 * errors field will include the `ajv` error
 * @class InputValidationError
 * @extends {Error}
 */
class InputValidationError extends Error {
  constructor (errors, place, message) {
    super(message)
    this.errors = errors
  }
}

module.exports = {
  init: init,
  validate: validate,
  InputValidationError: InputValidationError
}

var typeNameConversion = {
  header: 'headers'
}