'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const inputValidation = require('../../src/middleware');
const router = require('../router');

module.exports = () => {
    inputValidation.init('test/pet-store-swagger.yaml');

    const app = express();
    app.use(bodyParser.json());
    app.get('/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.post('/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.get('/pets/search', inputValidation.validate, function(req, res, next) {
        res.json({ result: 'OK' });
    });
    app.get('/pets/:petId', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.put('/pets', inputValidation.validate, function (req, res, next) {
        res.json({ result: 'OK' });
    });
    app.use('/petsRouter', inputValidation.validate, router);
    app.use(function (err, req, res, next) {
        if (err instanceof inputValidation.InputValidationError) {
            res.status(400).json({ more_info: JSON.stringify(err.errors) });
        }
    });

    return app;
};
