
const Validator = require('./Validator'),
    {simple} = require('./validator-utils');

class SimpleValidator extends Validator {
    constructor(schema) {
        super(simple, schema);
    }
}

module.exports = SimpleValidator;