'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const inputValidation = require('../../src/middleware');
const app = new Koa();
const router = new Router({
    prefix: '/v1'
});

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
    inputValidation.init('test/pet-store-swagger-with-base-path.yaml', { framework: 'koa', contentTypeValidation: true });

    router.get('/pets', inputValidation.validate, async function(ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });

    router.get('/capital', inputValidation.validate, function (ctx, next) {
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

    return app;
};
