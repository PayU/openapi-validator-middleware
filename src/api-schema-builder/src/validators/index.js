'use strict';

const Validator = require('./Validator'),
    OneOfValidator = require('./OneOfValidator'),
    SimpleValidator = require('./SimpleValidator'),
    DiscriminatorValidator = require('./DiscriminatorValidator');

module.exports = {
    Validator: Validator,
    OneOfValidator: OneOfValidator,
    SimpleValidator: SimpleValidator,
    DiscriminatorValidator
};