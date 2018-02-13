'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var inputValidation = require('../src/middleware');

module.exports = inputValidation.init('test/pet-store-swagger.yaml', {
    ajvConfigBody: {
        coerceTypes: true
    },
    makeOptionalAttributesNullable: true
})
    .then(function () {
        var app = express();
        app.use(bodyParser.json());
        app.get('/pets', inputValidation.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.post('/pets', inputValidation.validate, function (req, res, next) {
            res.json({ result: 'OK', receivedParams: req.body });
        });
        app.get('/pets/:petId', inputValidation.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.put('/pets', inputValidation.validate, function (req, res, next) {
            res.json({ result: 'OK', receivedParams: req.body });
        });
        app.use(function (err, req, res, next) {
            if (err instanceof inputValidation.InputValidationError) {
                res.status(400).json({ more_info: JSON.stringify(err.errors) });
            }
        });

        return Promise.resolve(app);
    });
