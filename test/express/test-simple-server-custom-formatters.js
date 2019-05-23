'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var inputValidation = require('../../src/middleware');

function customFormatter(errors, _config) {
    return {
        errors: JSON.stringify(errors),
        isCustom: true
    };
}

module.exports = inputValidation.init('test/pet-store-swagger.yaml',
    {
        errorFormatter: customFormatter
    })
    .then(() => {
        const app = express();
        app.use(bodyParser.json());
        app.post('/pets', inputValidation.validate, (req, res, next) => {
            res.json({result: 'OK'});
        });
        app.use((err, req, res, next) => {
            if (err.isCustom) {
                res.status(400).json({more_info: err.errors});
            }
        });

        return Promise.resolve(app);
    });
