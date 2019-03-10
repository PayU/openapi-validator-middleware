
class Validator {
    constructor(validationFunction, schema) {
        this.validate = validationFunction.bind(this, schema);
        this.errors = null;
    }
}

module.exports = Validator;