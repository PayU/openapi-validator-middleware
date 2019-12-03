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
    inputValidation.init(`${__dirname}/pets.yaml`, options || inputValidationOptions);
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());

    app.get('/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/pet', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.put('/dog/:id', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/pet-discriminator', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });

    app.post('/pet-discriminator-multiple', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/pet-discriminator-mapping', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/pet-discriminator-on-child', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/non-exist-path-in-swagger', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });

    app.use(function (err, req, res, next) {
        if (err instanceof inputValidation.InputValidationError) {
            res.status(400).json({ more_info: JSON.stringify(err.errors) });
        }
    });

    return app;
};
