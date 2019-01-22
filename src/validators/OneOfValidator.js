
const Validator = require('./Validator'),
    {oneOf} = require('./validator-utils');

class OneOfValidator extends Validator {
    constructor(schema) {
        super(oneOf, schema);
    }
}

module.exports = OneOfValidator;