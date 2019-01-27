
const Validator = require('./Validator');

class SimpleValidator extends Validator {
    constructor(schema) {
        super(simple, schema);
    }
}

function simple(ajvValidate, data) {
    let result = ajvValidate(data);
    this.errors = ajvValidate.errors;

    return result;
}

module.exports = SimpleValidator;