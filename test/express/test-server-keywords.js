'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const inputValidation = require('../../src/middleware');
const range = require('ajv-keywords/keywords/range');

const definition = {
    type: 'object',
    macro: function (schema) {
        if (schema.length === 0) return true;
        if (schema.length === 1) return { not: { required: schema } };
        const schemas = schema.map(function (prop) {
            return { required: [prop] };
        });
        return { not: { anyOf: schemas } };
    },
    metaSchema: {
        type: 'array',
        items: {
            type: 'string'
        }
    }
};

const inputValidationOptions = {
    keywords: [range, { name: 'prohibited', definition }],
    beautifyErrors: true,
    firstError: true,
    expectFormFieldsInBody: true
};

module.exports = () => {
    inputValidation.init('test/custom-keywords-swagger.yaml', inputValidationOptions);
    const app = express();
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

    return app;
};
