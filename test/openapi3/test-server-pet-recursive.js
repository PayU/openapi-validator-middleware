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
    inputValidation.init(`${__dirname}/pets-unlimited-recursive.yaml`, options || inputValidationOptions);
    const app = express();
    app.use(bodyParser.json());

    app.post('/pet-recursive', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });

    app.use(function (err, req, res, next) {
        if (err instanceof inputValidation.InputValidationError) {
            res.status(400).json({ more_info: JSON.stringify(err.errors) });
        }
    });

    return app;
};
