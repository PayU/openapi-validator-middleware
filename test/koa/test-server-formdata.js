'use strict';

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const inputValidation = require('../../src/middleware');
const multer = require('koa-multer');
const upload = multer();

const app = new Koa();
const router = new Router();

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
        { name: 'int32', pattern: /^\d{1,10}$/ },
        { name: 'file', validate: () => { return true } }
    ],
    beautifyErrors: true,
    firstError: true,
    expectFormFieldsInBody: true,
    framework: 'koa'
};

module.exports = () => {
    inputValidation.init('test/form-data-swagger.yaml', inputValidationOptions);
    router.post('/pets/import', upload.any(), inputValidation.validate, function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });
    router.post('/kennels/import', upload.any(), inputValidation.validate, function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });
    router.post('/login', upload.any(), inputValidation.validate, function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });
    router.post('/singleFile', upload.single("image"), inputValidation.validate, function (ctx, next) {
        ctx.status = 200;
        ctx.body = { result: 'OK' };
    });

    return app;
};
