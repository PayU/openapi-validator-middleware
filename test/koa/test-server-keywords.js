'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const inputValidation = require('../../src/middleware');
var range = require('ajv-keywords/keywords/range');

const definition = {
    type: 'object',
    macro: function (schema) {
        if (schema.length === 0) return true;
        if (schema.length === 1) return {not: {required: schema}};
        var schemas = schema.map(function (prop) {
            return {required: [prop]};
        });
        return {not: {anyOf: schemas}};
    },
    metaSchema: {
        type: 'array',
        items: {
            type: 'string'
        }
    }
};

let app = new Koa();
let router = new Router();

app.use(async function(ctx, next) {
    try {
        await next();
    } catch (err) {
        if (err instanceof inputValidation.InputValidationError) {
            ctx.status = 400;
            ctx.body = { more_info: JSON.stringify(err.errors) };
        }
    }
});
app.use(bodyParser());
app.use(router.routes());

var inputValidationOptions = {
    keywords: [range, { name: 'prohibited', definition }],
    beautifyErrors: true,
    firstError: true,
    expectFormFieldsInBody: true,
    framework: 'koa'
};

module.exports = inputValidation.init('test/custom-keywords-swagger.yaml', inputValidationOptions)
    .then(function () {
        router.post('/keywords', inputValidation.validate, function (ctx, next) {
            ctx.status = 200;
            ctx.body = { result: 'OK' };
        });
        return Promise.resolve(app);
    });
