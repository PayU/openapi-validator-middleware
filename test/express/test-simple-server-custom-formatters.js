'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const inputValidation = require('../../src/middleware');

function customFormatter(errors, config) {
    return {
        errors: JSON.stringify(errors),
        isCustom: true,
        extraText: config.paramsForFormatter.extraText
    };
}

module.exports = inputValidation.init('test/pet-store-swagger.yaml',
    {
        errorFormatter: customFormatter,
        paramsForFormatter: {
            extraText: 'dummy-text'
        }
    })
    .then(() => {
        const app = express();
        app.use(bodyParser.json());
        app.post('/pets', inputValidation.validate, (req, res, next) => {
            res.json({ result: 'OK' });
        });
        app.use((err, req, res, next) => {
            if (err.isCustom) {
                res.status(400).json({ more_info: err.errors, extra_text: err.extraText });
            }
        });

        return Promise.resolve(app);
    });
