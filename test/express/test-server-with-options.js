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
    firstError: true,
    contentTypeValidation: true
};

module.exports = () => {
    inputValidation.init('test/pet-store-swagger.yaml', inputValidationOptions);
    const app = express();
    app.use(bodyParser.json());
    app.get('/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.get('/pets/:petId', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.put('/pets/:petId', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.put('/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.put('/text', bodyParser.text(), inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.use(function (err, req, res, next) {
        if (err instanceof inputValidation.InputValidationError) {
            res.status(400).json({ more_info: err.errors });
        }
    });

    return app;
};
