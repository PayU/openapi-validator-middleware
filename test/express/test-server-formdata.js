'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const inputValidation = require('../../src/middleware');
const multer = require('multer');
const upload = multer();

const inputValidationOptions = {
    formats: [
        { name: 'double', pattern: /\d+(\.\d+)?/ },
        { name: 'int64', pattern: /^\d{1,19}$/ },
        { name: 'int32', pattern: /^\d{1,10}$/ },
        {
            name: 'file',
            validate: () => {
                return true;
            }
        }
    ],
    beautifyErrors: true,
    firstError: true,
    expectFormFieldsInBody: true
};

module.exports = () => {
    inputValidation.init('test/form-data-swagger.yaml', inputValidationOptions);

    const app = express();
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
    app.post('/singleFile', upload.single("image"), inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.use(function (err, req, res, next) {
        if (err instanceof inputValidation.InputValidationError) {
            res.status(400).json({ more_info: err.errors });
        }
    });

    module.exports = app;

    return app;
};
