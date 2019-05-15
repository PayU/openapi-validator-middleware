# express-ajv-swagger-validation
[![NPM](https://nodei.co/npm/express-ajv-swagger-validation.png)](https://nodei.co/npm/express-ajv-swagger-validation/)

[![NPM](https://nodei.co/npm-dl/express-ajv-swagger-validation.png?height=3)](https://nodei.co/npm/express-ajv-swagger-validation/)

[![Join the chat at https://gitter.im/Zooz/express-ajv-swagger-validation](https://badges.gitter.im/Zooz/express-ajv-swagger-validation.svg)](https://gitter.im/Zooz/express-ajv-swagger-validation?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Apache 2.0 License][license-image]][license-url]

This package provides data validation within an Express or Koa app in according to a [Swagger/OpenAPI definition](https://swagger.io/specification/). It uses [Ajv](https://www.npmjs.com/package/ajv) under the hood for validation.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  <!-- *generated with [DocToc](https://github.com/thlorenz/doctoc)* -->

- [Installation](#installation)
- [API](#api)
  - [express-ajv-swagger-validation.validate](#express-ajv-swagger-validationvalidate)
  - [express-ajv-swagger-validation.init(pathToSwaggerFile, options)](#express-ajv-swagger-validationinitpathtoswaggerfile-options)
    - [Options](#options)
- [Usage Example](#usage-example)
  - [Express](#express)
  - [Koa](#koa)
- [Important Notes](#important-notes)
  - [Schema Objects](#schema-objects)
  - [Multipart/form-data (files)](#multipartform-data-files)
  - [Koa support](#koa-support)
  - [Koa packages](#koa-packages)
- [Known Issues with OpenAPI 3](#known-issues-with-openapi-3)
- [Running Tests](#running-tests)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install using the node package registry:

```bash
npm install --save express-ajv-swagger-validation
```

Then import the module in your code:

```js
const swaggerValidation = require('express-ajv-swagger-validation');
```

## API

### express-ajv-swagger-validation.validate

This middleware function validates the request body, headers, path parameters and query parameters according to the _paths_ definition of the swagger file. Make sure to use this middleware inside a route definition in order to have `req.route.path` assigned to the most accurate express route.

### express-ajv-swagger-validation.init(pathToSwaggerFile, options)

Initialize the middleware using a swagger definition.

- `pathToSwaggerFile`: Path to the swagger definition.
- `options`: Additional options for the middleware (see below).
- **Return Value:** Promise

#### Options

Options currently supported:
- `framework` - Defines in which framework the middleware is working ('koa' or 'express'). As default, set to 'express'.
- `formats` - Array of formats that can be added to `ajv` configuration, each element in the array should include `name` and `pattern`.
    ```js
    formats: [
        { name: 'double', pattern: /\d+\.(\d+)+/ },
        { name: 'int64', pattern: /^\d{1,19}$/ },
        { name: 'int32', pattern: /^\d{1,10}$/ }
    ]
    ```

- `keywords` - Array of keywords that can be added to `ajv` configuration, each element in the array can be either an object or a function. 
If the element is an object, it must include `name` and `definition`. If the element is a function, it should accept `ajv` as its first argument and inside the function you need to call `ajv.addKeyword` to add your custom keyword 
- `beautifyErrors`- Boolean that indicates if to beautify the errors, in this case it will create a string from the Ajv error.
    - Examples:
        - `query/limit should be <= 100` - query param
        - `path/petId should NOT be shorter than 3 characters` - path param not in format
        - `body/[0].test.field1 should be string` - Item in an array body
        - `body/test should have required property 'field1'` - nested field
        - `body should have required property 'name'` - Missing field in body

    You can see more examples in the [tests](./test).

- `firstError` - Boolean that indicates if to return only the first error.
- `makeOptionalAttributesNullable` - Boolean that forces preprocessing of Swagger schema to include 'null' as possible type for all non-required properties. Main use-case for this is to ensure correct handling of null values when Ajv type coercion is enabled
- `ajvConfigBody` - Object that will be passed as config to new Ajv instance which will be used for validating request body. Can be useful to e. g. enable type coercion (to automatically convert strings to numbers etc). See Ajv documentation for supported values.
- `ajvConfigParams` - Object that will be passed as config to new Ajv instance which will be used for validating request body. See Ajv documentation for supported values.
- `contentTypeValidation` - Boolean that indicates if to perform content type validation in case `consume` field is specified and the request body is not empty.
- `expectFormFieldsInBody` - Boolean that indicates whether form fields of non-file type that are specified in the schema should be validated against request body (e. g. Multer is copying text form fields to body)

## Usage Example
### Express
```js
swaggerValidator.init('test/unit-tests/input-validation/pet-store-swagger.yaml')
    .then(function () {
        const app = express();
        app.use(bodyParser.json());
        app.get('/pets', swaggerValidator.validate, function (req, res, next) {
            return res.json({ result: 'OK' });
        });
        app.post('/pets', swaggerValidator.validate, function (req, res, next) {
            return res.json({ result: 'OK' });
        });
        app.get('/pets/:petId', swaggerValidator.validate, function (req, res, next) {
            return res.json({ result: 'OK' });
        });

        app.use(function (err, req, res) {
            if (err instanceof swaggerValidator.InputValidationError) {
                return res.status(400).json({ more_info: JSON.stringify(err.errors) });
            }
        });

        const server = app.listen(serverPort, function () {});
    });
```

### Koa
```js
'use strict';
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const inputValidation = require('../../src/middleware');
let app = new Koa();
let router = new Router();
app.use(bodyParser());
app.use(router.routes());
module.exports = inputValidation.init('test/pet-store-swagger.yaml', {framework: 'koa'})
    .then(function () {
        router.get('/pets', inputValidation.validate, async function(ctx, next) {
            ctx.status = 200;
            ctx.body = { result: 'OK' };
        });
        router.post('/pets', inputValidation.validate, async function (ctx, next) {
            ctx.status = 200;
            ctx.body = { result: 'OK' };
        });
        router.get('/pets/:petId', inputValidation.validate, async function (ctx, next) {
            ctx.status = 200;
            ctx.body = { result: 'OK' };
        });
        router.put('/pets', inputValidation.validate, async function (ctx, next) {
            ctx.status = 200;
            ctx.body = { result: 'OK' };
        });

        return Promise.resolve(app);
    });
```

## Important Notes

### Schema Objects

It is important to set the `type` property of any [Schema Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schema-object) explicitly to `object`. Although it isn't required in the OpenAPI specification, it is necessary in order for [Ajv](https://www.npmjs.com/package/ajv) to work correctly.

### Multipart/form-data (files) 

Multipart/form-data (files) support is based on [`express/multer`](https://github.com/expressjs/multer).

### Koa support

When using this package as middleware for koa, the validations errors are being thrown.

### Koa packages

This package supports Koa servers that use [`koa-router`](https://www.npmjs.com/package/koa-router), [`koa-bodyparser`](https://www.npmjs.com/package/koa-bodyparser) and [`koa-multer`](https://www.npmjs.com/package/koa-multer).

## Known Issues with OpenAPI 3 

- Inheritance with a discriminator is supported only if the ancestor object is the discriminator.
- The discriminator support in the inheritance chain stops when getting to a child without a discriminator (a leaf in the inheritance tree), meaning a child without a discriminator cannot point to another child with a discriminator.

## Running Tests

The tests use mocha, istanbul and mochawesome. Run them using the node test script:

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
[snyk-image]: https://snyk.io/test/npm/express-ajv-swagger-validation/badge.svg
[snyk-url]: https://snyk.io/test/npm/express-ajv-swagger-validation
