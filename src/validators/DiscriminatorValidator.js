
const Validator = require('./Validator'),
    {discriminator} = require('./validator-utils');

class DiscriminatorValidator extends Validator {
    constructor(schema) {
        super(discriminator, schema);
    }
}

module.exports = DiscriminatorValidator;
