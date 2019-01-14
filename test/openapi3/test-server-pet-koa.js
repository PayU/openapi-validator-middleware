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
var inputValidationOptions = {
    formats: [
        { name: 'double', pattern: /\d+(\.\d+)?/ },
        { name: 'int64', pattern: /^\d{1,19}$/ },
        { name: 'int32', pattern: /^\d{1,10}$/ }
    ],
    beautifyErrors: true,
    firstError: true
};

module.exports = function (options) {
    return inputValidation.init(`${__dirname}/pets.yaml`, options || inputValidationOptions)
        .then(function () {
            router.post('/pet', inputValidation.validate, function (ctx, next) {
                ctx.status = 200;
                ctx.body = { result: 'OK' };
            });
            router.post('/pet-discriminator', inputValidation.validate, function (ctx, next) {
                ctx.status = 200;
                ctx.body = { result: 'OK' };
            });

            router.post('/pet-discriminator-multiple', inputValidation.validate, function (ctx, next) {
                ctx.status = 200;
                ctx.body = { result: 'OK' };
            });
            router.post('/pet-discriminator-mapping', inputValidation.validate, function (ctx, next) {
                ctx.status = 200;
                ctx.body = { result: 'OK' };
            });

            return Promise.resolve(app);
        });
};
