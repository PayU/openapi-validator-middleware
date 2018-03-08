# express-ajv-swagger-validation
[![NPM](https://nodei.co/npm/express-ajv-swagger-validation.png)](https://nodei.co/npm/express-ajv-swagger-validation/)

[![NPM](https://nodei.co/npm-dl/express-ajv-swagger-validation.png?height=3)](https://nodei.co/npm/express-ajv-swagger-validation/)

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![NSP Status](https://nodesecurity.io/orgs/zooz/projects/3244db73-7215-4526-8cb0-b5b1e640fc6e/badge)](https://nodesecurity.io/orgs/zooz/projects/3244db73-7215-4526-8cb0-b5b1e640fc6e)
[![Apache 2.0 License][license-image]][license-url]

This package is used to perform input validation to express app using a [Swagger (Open API)](https://swagger.io/specification/) definition and [ajv](https://www.npmjs.com/package/ajv)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  <!-- *generated with [DocToc](https://github.com/thlorenz/doctoc)* -->

- [express-ajv-swagger-validation](#express-ajv-swagger-validation)
  - [Install](#install)
  - [API](#api)
    - [How to use](#how-to-use)
    - [express-ajv-swagger-validation.validate](#express-ajv-swagger-validationvalidate)
    - [express_node_metrics.metrics.init(PathToSwaggerFile, options)](#express_node_metricsmetricsinitpathtoswaggerfile-options)
      - [Arguments](#arguments)
        - [Options](#options)
  - [Examples](#examples)
  - [Running Tests](#running-tests)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install
```bash
npm install --save express-ajv-swagger-validation
```

## API

### How to use

```js
var swaggerValidator = require('express-ajv-swagger-validation');
```

### express-ajv-swagger-validation.validate

This Middleware validate the request body, headers, path parameters and query parameters according to the path definition in the swagger file.
Please make sure to use this middleware inside route definition in order to have `req.route.path` assign to the most accurate express route.

### express-ajv-swagger-validation.init(PathToSwaggerFile, options)

Init the middleware with the swagger definition.

The function return Promise.

#### Arguments

* `PathToSwaggerFile` &ndash; Path to the swagger definition
* `options` &ndash; Additional options for the middleware.

##### Options

Options currently supports:
- `formats` - Array of formats that can be added to `ajv` configuration, each element in the array should include `name` and `pattern`.
- `beautifyErrors`- Boolean that indicates if to beautify the errors, in this case it will create a string from the Ajv error.
    - Examples:
        - `query/limit should be <= 100` - query param
        - `path/petId should NOT be shorter than 3 characters` - path param not in format
        - `body/[0].test.field1 should be string` - Item in an array body
        - `body/test should have required property 'field1'` - nested field
        - `body should have required property 'name'` - Missing field in body

    You can see more examples in the tests

- `firstError` - Boolean that indicates if to return only the first error.
- `makeOptionalAttributesNullable` - Boolean that forces preprocessing of Swagger schema to include 'null' as possible type for all non-required properties. Main use-case for this is to ensure correct handling of null values when Ajv type coercion is enabled
- `ajvConfigBody` - Object that will be passed as config to new Ajv instance which will be used for validating request body. Can be useful to e. g. enable type coercion (to automatically convert strings to numbers etc). See Ajv documentation for supported values.
- `ajvConfigParams` - Object that will be passed as config to new Ajv instance which will be used for validating request body. See Ajv documentation for supported values.
- `contentTypeValidation` - Boolean that indicates if to perform content type validation in case `consume` field is specified and the request body is not empty.

```js
formats: [
    { name: 'double', pattern: /\d+\.(\d+)+/ },
    { name: 'int64', pattern: /^\d{1,19}$/ },
    { name: 'int32', pattern: /^\d{1,10}$/ }
]
```

## Usage Example

```js
swaggerValidator.init('test/unit-tests/input-validation/pet-store-swagger.yaml')
    .then(function () {
        var app = express();
        app.use(bodyParser.json());
        app.get('/pets', swaggerValidator.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.post('/pets', swaggerValidator.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.get('/pets/:petId', swaggerValidator.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });

        app.use(function (err, req, res, next) {
            if (err instanceof swaggerValidator.InputValidationError) {
                res.status(400).json({ more_info: JSON.stringify(err.errors) });
            }
        });

        var server = app.listen(serverPort, function () {
        });
    });
```

## Important Notes

- Objects - it is important to set any objects with the property `type: object` inside your swagger file, although it isn't a must in the Swagger (OpenAPI) spec in order to validate it accurately with [ajv](https://www.npmjs.com/package/ajv) it must be marked as `object`
- multipart/form-data (files) supports is based on [`express/multer`](https://github.com/expressjs/multer)

## Running Tests
Using mocha, istanbul and mochawesome
```bash
npm test
```

[npm-image]: https://img.shields.io/npm/v/express-ajv-swagger-validation.svg?style=flat
[npm-url]: https://npmjs.org/package/express-ajv-swagger-validation
[travis-image]: https://travis-ci.org/Zooz/express-ajv-swagger-validation.svg?branch=master
[travis-url]: https://travis-ci.org/Zooz/express-ajv-swagger-validation
[coveralls-image]: https://coveralls.io/repos/github/Zooz/express-ajv-swagger-validation/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/Zooz/express-ajv-swagger-validation?branch=master
[downloads-image]: http://img.shields.io/npm/dm/express-ajv-swagger-validation.svg?style=flat
[downloads-url]: https://npmjs.org/package/express-ajv-swagger-validation
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
[license-url]: LICENSE
