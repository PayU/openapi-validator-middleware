# express-ajv-swagger-validation
[![NPM](https://nodei.co/npm/express-ajv-swagger-validation.png)](https://nodei.co/npm/express-ajv-swagger-validation/)

[![NPM](https://nodei.co/npm-dl/express-ajv-swagger-validation.png?height=3)](https://nodei.co/npm/express-ajv-swagger-validation/)

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![NSP Status](https://nodesecurity.io/orgs/zooz-test/projects/012e3ff9-f6a8-4eb2-86ef-4173af622196/badge)](https://nodesecurity.io/orgs/zooz-test/projects/012e3ff9-f6a8-4eb2-86ef-4173af622196)
[![MIT License][license-image]][license-url]

This package is used to perform input validation to express app using a [Swagger (Open API)](https://swagger.io/specification/) definition and [ajv](https://www.npmjs.com/package/ajv)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

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

### express_node_metrics.metrics.init(PathToSwaggerFile, options)

Init the middleware with the swagger definition.

The function return Promise.

#### Arguments

* `PathToSwaggerFile` &ndash; Path to the swagger definition
* `options` &ndash; Additional options for the middleware.

##### Options

Options currently supports:
- `formats` - array of formats that can be added to `ajv` configuration, each element in the array should include `name` and `pattern`

``` js
formats: [
    { name: 'double', pattern: /\d+(\.\d+)?/ },
    { name: 'int64', pattern: /^\d{1,18}$/ }
]
```

## Examples

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

## Running Tests
Using mocha, istanbul and mochawesome
```bash
npm test
```

[npm-image]: https://img.shields.io/npm/v/express-ajv-swagger-validation.svg?style=flat
[npm-url]: https://npmjs.org/package/express-ajv-swagger-validation
[travis-image]: https://travis-ci.org/idanto/express-ajv-swagger-validation.svg?branch=master
[travis-url]: https://travis-ci.org/idanto/express-ajv-swagger-validation
[coveralls-image]: https://coveralls.io/repos/github/idanto/express-ajv-swagger-validation/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/idanto/express-ajv-swagger-validation?branch=master
[downloads-image]: http://img.shields.io/npm/dm/express-ajv-swagger-validation.svg?style=flat
[downloads-url]: https://npmjs.org/package/express-ajv-swagger-validation
[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE