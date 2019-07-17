'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const inputValidation = require('../../src/middleware');
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

module.exports = () => {
    inputValidation.init('test/pet-store-swagger.yaml', {
        framework: 'koa',
        ajvConfigBody: {
            coerceTypes: true },
        makeOptionalAttributesNullable: true });

    router.get('/pets', inputValidation.validate, async function(ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });
    router.post('/pets', inputValidation.validate, async function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK', receivedParams: ctx.request.body };
    });
    router.get('/pets/:petId', inputValidation.validate, async function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });
    router.put('/pets', inputValidation.validate, async function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK', receivedParams: ctx.request.body };
    });
    router.patch('/pets', inputValidation.validate, async function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK', receivedParams: ctx.request.body };
    });

    return app;
};
