'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var inputValidation = require('../../src/middleware');
var multer = require('multer');
var upload = multer();

var inputValidationOptions = {
    formats: [
        { name: 'double', pattern: /\d+(\.\d+)?/ },
        { name: 'int64', pattern: /^\d{1,19}$/ },
        { name: 'int32', pattern: /^\d{1,10}$/ },
        { name: 'file', validate: () => { return true } }
    ],
    beautifyErrors: true,
    firstError: true,
    expectFormFieldsInBody: true
};

module.exports = inputValidation.init('test/form-data-swagger.yaml', inputValidationOptions)
    .then(function () {
        var app = express();
        app.use(bodyParser.json());
        app.post('/pets/import', upload.any(), inputValidation.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.post('/kennels/import', upload.any(), inputValidation.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.post('/login', upload.any(), inputValidation.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.use(function (err, req, res, next) {
            if (err instanceof inputValidation.InputValidationError) {
                res.status(400).json({ more_info: err.errors });
            }
        });

        module.exports = app;

        return Promise.resolve(app);
    });
