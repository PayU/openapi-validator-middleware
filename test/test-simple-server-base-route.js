'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var inputValidation = require('../src/middleware');

var router = express.Router();
router.route('/').get(inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});
router.route('/').post(inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});
router.route('/:petId').get(inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});

var router1 = express.Router();
router1.route('/pets').put(inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});

module.exports = inputValidation.init('test/pet-store-swagger.yaml')
    .then(function () {
        var app = express();
        app.use(bodyParser.json());
        app.use('/pets', router);
        app.use('/', router1);
        app.use(function (err, req, res, next) {
            if (err instanceof inputValidation.InputValidationError) {
                res.status(400).json({ more_info: JSON.stringify(err.errors) });
            }
        });

        return Promise.resolve(app);
    });