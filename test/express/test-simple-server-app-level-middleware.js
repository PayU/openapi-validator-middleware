'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var inputValidation = require('../../src/middleware');

module.exports = inputValidation.init('test/pet-store-swagger.yaml')
    .then(function () {
        var app = express();
        app.use(bodyParser.json());
        app.use(inputValidation.validate)
        app.post('/pets', function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.get('/pets/:petId', function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.put('/pets', function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.use(function (err, req, res, next) {
            if (err instanceof inputValidation.InputValidationError) {
                res.status(400).json({ more_info: JSON.stringify(err.errors) });
            }
        });

        return Promise.resolve(app);
    });
