'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var inputValidation = require('../../src/middleware');
var range = require('ajv-keywords/keywords/range');

const definition = {
    type: 'object',
    macro: function (schema) {
        if (schema.length === 0) return true;
        if (schema.length === 1) return {not: {required: schema}};
        var schemas = schema.map(function (prop) {
            return {required: [prop]};
        });
        return {not: {anyOf: schemas}};
    },
    metaSchema: {
        type: 'array',
        items: {
            type: 'string'
        }
    }
};

var inputValidationOptions = {
    keywords: [range, { name: 'prohibited', definition }],
    beautifyErrors: true,
    firstError: true,
    expectFormFieldsInBody: true
};

module.exports = inputValidation.init('test/custom-keywords-swagger.yaml', inputValidationOptions)
    .then(function () {
        var app = express();
        app.use(bodyParser.json());
        app.post('/keywords', inputValidation.validate, function (req, res, next) {
            res.json({ result: 'OK' });
        });
        app.use(function (err, req, res, next) {
            if (err instanceof inputValidation.InputValidationError) {
                res.status(400).json({ more_info: err.errors });
            }
        });

        module.exports = app;

        return Promise.resolve(app);
    });
