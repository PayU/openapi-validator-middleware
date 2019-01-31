
const Validator = require('./Validator'),
    validatorUtils = require('./validator-utils');

class OneOfValidator extends Validator {
    constructor(schema) {
        super(oneOf, schema);
    }
}
function oneOf(schemas, data) {
    let schema = schemas[data[schemas.discriminator]];
    let result = false;
    if (schema) {
        result = schema(data);
        this.errors = schema.errors;
    } else {
        validatorUtils.allowedValuesError.call(this, schemas.discriminator, schemas.inheritance);
    }

    return result;
}
module.exports = OneOfValidator;