'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const inputValidation = require('../../src/middleware');
const router = require('../router');

module.exports = () => {
    inputValidation.init('test/pet-store-swagger-with-base-path.yaml', { contentTypeValidation: true });
    const app = express();
    app.use(bodyParser.json());

    app.get('/v1/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/v1/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.get('/v1/capital', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.put('/v1/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.use('/v1', router);

    app.use(function (err, req, res, next) {
        if (err instanceof inputValidation.InputValidationError) {
            res.status(400).json({ more_info: JSON.stringify(err.errors) });
        }
    });

    return app;
};
