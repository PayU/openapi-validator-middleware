'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const inputValidation = require('../../src/middleware');

const router = express.Router();
router.route('/').get(inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});
router.route('/').post(inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});
router.route('/:petId').get(inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});

const router1 = express.Router();
router1.route('/pets').put(inputValidation.validate, function (req, res, next) {
    res.json({ result: 'OK' });
});

module.exports = () => {
    inputValidation.init('test/pet-store-swagger.yaml');

    const app = express();
    app.use(bodyParser.json());
    app.use('/pets', router);
    app.use('/', router1);
    app.use(function (err, req, res, next) {
        if (err instanceof inputValidation.InputValidationError) {
            res.status(400).json({ more_info: JSON.stringify(err.errors) });
        }
    });

    return app;
};
