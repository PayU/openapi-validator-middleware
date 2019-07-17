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
            ctx.body = { more_info: err.errors };
        }
    }
});
app.use(bodyParser({ enableTypes: ['text', 'json'] }));
app.use(router.routes());

let inputValidationOptions = {
    formats: [
        { name: 'double', pattern: /\d+(\.\d+)?/ },
        { name: 'int64', pattern: /^\d{1,19}$/ },
        { name: 'int32', pattern: /^\d{1,10}$/ }
    ],
    beautifyErrors: true,
    firstError: true,
    contentTypeValidation: true,
    framework: 'koa'
};

module.exports = () => {
    inputValidation.init('test/pet-store-swagger.yaml', inputValidationOptions);
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
    router.put('/pets/:petId', inputValidation.validate, function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });
    router.put('/pets', inputValidation.validate, async function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });
    router.put('/text', inputValidation.validate, function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });

    return app;
};
