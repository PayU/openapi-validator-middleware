'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const inputValidation = require('../../src/middleware');

const inputValidationOptions = {
    formats: [
        { name: 'double', pattern: /\d+(\.\d+)?/ },
        { name: 'int64', pattern: /^\d{1,19}$/ },
        { name: 'int32', pattern: /^\d{1,10}$/ }
    ],
    beautifyErrors: true,
    firstError: true
};

module.exports = function (options) {
    const inputValidationWithGet = inputValidation.getNewMiddleware(`${__dirname}/pets-instance1.yaml`, options || inputValidationOptions);
    const inputValidationWithPost = inputValidation.getNewMiddleware(`${__dirname}/pets-instance2.yaml`, options || inputValidationOptions);

    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());

    app.get('/pets', inputValidationWithGet.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/pets', inputValidationWithPost.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });

    app.use(function (err, req, res, next) {
        if (err instanceof inputValidation.InputValidationError) {
            res.status(400).json({ more_info: JSON.stringify(err.errors) });
        }
    });

    return app;
};
