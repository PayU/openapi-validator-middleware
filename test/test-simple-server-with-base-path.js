'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var inputValidation = require('../src/middleware');
var router = require('./router');

module.exports = inputValidation.init('test/pet-store-swagger-with-base-path.yaml', { contentTypeValidation: true })
    .then(function () {
        var app = express();
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

        return Promise.resolve(app);
    });