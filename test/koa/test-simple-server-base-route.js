'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const inputValidation = require('../../src/middleware');
let app = new Koa();
let router = new Router({
    prefix: '/pets'
});
let router1 = new Router();

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
app.use(router1.routes());

router.get('/', inputValidation.validate, async function(ctx, next) {
    ctx.status = 200;
    ctx.body = { result: 'OK' };
});
router.post('/', inputValidation.validate, async function (ctx, next) {
    ctx.status = 200;
    ctx.body = { result: 'OK' };
});
router.get('/:petId', inputValidation.validate, async function (ctx, next) {
    ctx.status = 200;
    ctx.body = { result: 'OK' };
});
router1.put('/pets', inputValidation.validate, async function (ctx, next) {
    ctx.status = 200;
    ctx.body = { result: 'OK' };
});

module.exports = () => {
    inputValidation.init('test/pet-store-swagger.yaml', { framework: 'koa' });
    return app;
};
