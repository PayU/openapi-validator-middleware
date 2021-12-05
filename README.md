# openapi-validator-middleware

[![NPM Version][npm-image]][npm-url]
![main workflow](https://github.com/PayU/openapi-validator-middleware/actions/workflows/main.yml/badge.svg)
[![NPM Downloads][downloads-image]][downloads-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Apache 2.0 License][license-image]][license-url]

This package provides data validation within an Express, Koa or Fastify app according to a [Swagger/OpenAPI definition](https://swagger.io/specification/). It uses [Ajv](https://www.npmjs.com/package/ajv) under the hood for validation.

NOTICE: As this package gone through a long way, as we added support for OpenAPI definitions, while also adding support for more frameworks such as Koa and Fastify, we finally took the step of changing [express-ajv-swagger-validation](https://www.npmjs.com/package/express-ajv-swagger-validation) name to something that describes it better. As of now we'll be using the name [openapi-validator-middleware](https://www.npmjs.com/package/openapi-validator-middleware) instead.  
There are no code changes in `openapi-validator-middleware@2.0.0` compared to `express-ajv-swagger-validation@1.2.0` apart from the name change.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  <!-- *generated with [DocToc](https://github.com/thlorenz/doctoc)* -->

- [openapi-validator-middleware](#openapi-validator-middleware)
  - [Installation](#installation)
  - [API](#api)
    - [openapi-validator-middleware.validate(fastifyOptions)](#openapi-validator-middlewarevalidatefastifyoptions)
      - [fastifyOptions](#fastifyoptions)
    - [openapi-validator-middleware.init(pathToSwaggerFile, options)](#openapi-validator-middlewareinitpathtoswaggerfile-options)
    - [openapi-validator-middleware.initAsync(pathToSwaggerFile, options)](#openapi-validator-middlewareinitasyncpathtoswaggerfile-options)
      - [Options](#options)
  - [Usage Example](#usage-example)
    - [Express](#express)
    - [Koa](#koa)
    - [Fastify](#fastify)
    - [Multiple-instances](#multiple-instances)
  - [Important Notes](#important-notes)
    - [Schema Objects](#schema-objects)
    - [Multipart/form-data (files)](#multipartform-data-files)
    - [Fastify support](#fastify-support)
    - [Koa support](#koa-support)
    - [Koa packages](#koa-packages)
  - [Known Issues with OpenAPI 3](#known-issues-with-openapi-3)
  - [Running Tests](#running-tests)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install using the node package registry:

```bash
npm install --save openapi-validator-middleware
```

Then import the module in your code:

```js
const swaggerValidation = require('openapi-validator-middleware');
```

## API

### openapi-validator-middleware.validate(fastifyOptions)

This middleware function validates the request body, headers, path parameters and query parameters according to the _paths_ definition of the swagger file. Make sure to use this middleware inside a route definition in order to have `req.route.path` assigned to the most accurate express route.

- `fastifyOptions`: Only applicable for `fastify` framework. See below.

#### fastifyOptions

- `skiplist`: Endpoint paths for which validation should not be applied. An array of strings in RegExp format, e. g. `['^/pets$']` 

### openapi-validator-middleware.init(pathToSwaggerFile, options)

Initialize the middleware using a swagger definition.
The function executes synchronously and does not return anything.

- `pathToSwaggerFile`: Path to the swagger definition.
- `options`: Additional options for the middleware ([see below](#options)).

### openapi-validator-middleware.initAsync(pathToSwaggerFile, options)

Initialize the middleware using a swagger definition.
The function executes asynchronously and the resolved promise does not return anything.

This Initilaztion function also supports schema with references to external files. 

- `pathToSwaggerFile`: Path to the swagger definition.
- `options`: Additional options for the middleware ([see below](#options)).

#### Options

Options currently supported:
- `framework` - Defines in which framework the middleware is working ('fastify', 'koa' or 'express'). As default, set to 'express'.
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
- `errorFormatter` - optional custom function that will be invoked to create a validation error that will be thrown if Ajv validation fails. Function should accept two parameters: `(errors, middlewareOptions)` and return an error that will be thrown.

## Usage Example
### Express
```js
swaggerValidation.init('test/unit-tests/input-validation/pet-store-swagger.yaml');
const app = express();
app.use(bodyParser.json());
app.get('/pets', swaggerValidation.validate, (req, res, next) => {
    return res.json({ result: 'OK' });
});
app.post('/pets', swaggerValidation.validate, (req, res, next) => {
    return res.json({ result: 'OK' });
});
app.get('/pets/:petId', swaggerValidation.validate, (req, res, next) => {
    return res.json({ result: 'OK' });
});

app.use((err, req, res, next) => {
    if (err instanceof swaggerValidation.InputValidationError) {
        return res.status(400).json({ more_info: JSON.stringify(err.errors) });
    }
});

const server = app.listen(serverPort, () => {});
```

### Koa
```js
'use strict';
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const inputValidation = require('openapi-validator-middleware');
const app = new Koa();
const router = new Router();
app.use(bodyParser());
app.use(router.routes());
inputValidation.init('test/pet-store-swagger.yaml', { framework: 'koa' });

router.get('/pets', inputValidation.validate, async (ctx, next) => {
    ctx.status = 200;
    ctx.body = { result: 'OK' };
});
router.post('/pets', inputValidation.validate, async (ctx, next) => {
    ctx.status = 200;
    ctx.body = { result: 'OK' };
});
router.get('/pets/:petId', inputValidation.validate, async (ctx, next) => {
    ctx.status = 200;
    ctx.body = { result: 'OK' };
});
router.put('/pets', inputValidation.validate, async (ctx, next) => {
    ctx.status = 200;
    ctx.body = { result: 'OK' };
});

app.use(async (ctx, next) => {
    try {
        return await next();
    } catch (err) {
        if (err instanceof inputValidation.InputValidationError) {
            ctx.status = 400;
            ctx.body = err.errors;
        }
        throw err;
    }
})
app.listen(process.env.PORT || 8888, function () {
    console.log('listening on', this.address());
});
```

### Fastify
```js
'use strict';
const fastify = require('fastify');
const inputValidation = require('openapi-validator-middleware');

async function getApp() {
    inputValidation.init('test/pet-store-swagger.yaml', { 
        framework: 'fastify'
    });
    const app = fastify({ logger: true });

    app.register(inputValidation.validate({
      skiplist: ['^/_metrics$']
    }));
    app.setErrorHandler(async (err, req, reply) => {
        if (err instanceof inputValidation.InputValidationError) {
             return reply.status(400).send({ more_info: JSON.stringify(err.errors) });
        }

        reply.status(500);
        reply.send();
    });

    app.get('/pets', (req, reply) => {
        reply.status(204).send();
    });

    await app.ready();
    return app;
}
```

### multiple-instances
```js
const inputValidation = require('openapi-validator-middleware');
const validatorA = inputValidation.getNewMiddleware('test/pet-store-swaggerA.yaml', {framework: 'express'});
const validatorB = inputValidation.getNewMiddleware('test/pet-store-swaggerB.yaml', {framework: 'express'});

app.get('/pets', validatorA.validate, (req, res, next) => {
    return res.json({ result: 'OK' });
});

app.post('/pets', validatorB.validate, (req, res, next) => {
    return res.json({ result: 'OK' });
});

```
## Important Notes

### Schema Objects

It is important to set the `type` property of any [Schema Objects](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schema-object) explicitly to `object`. Although it isn't required in the OpenAPI specification, it is necessary in order for [Ajv](https://www.npmjs.com/package/ajv) to work correctly.

### Multipart/form-data (files) 

Multipart/form-data (files) support is based on [`express/multer`](https://github.com/expressjs/multer).

### Fastify support

Fastify support requires `uri-js` dependency to be installed. Make sure to run `npm install uri-js`.
When using this package as a middleware for fastify, the validations errors will be thrown.

### Koa support

When using this package as middleware for koa, the validations errors will be thrown.

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

[npm-image]: https://img.shields.io/npm/v/openapi-validator-middleware.svg?style=flat
[npm-url]: https://npmjs.org/package/openapi-validator-middleware
[coveralls-image]: https://coveralls.io/repos/github/PayU/openapi-validator-middleware/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/PayU/openapi-validator-middleware?branch=master
[downloads-image]: http://img.shields.io/npm/dm/openapi-validator-middleware.svg?style=flat
[downloads-url]: https://img.shields.io/npm/dm/openapi-validator-middleware.svg
[license-image]: https://img.shields.io/badge/license-Apache_2.0-green.svg?style=flat
[license-url]: LICENSE
[snyk-image]: https://snyk.io/test/github/PayU/openapi-validator-middleware/badge.svg?targetFile=package.json
[snyk-url]: https://snyk.io/test/github/PayU/openapi-validator-middleware?targetFile=package.json
