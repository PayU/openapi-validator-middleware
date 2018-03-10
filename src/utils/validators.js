'use strict';

class Validator {
    constructor(validationFunction, schema) {
        this.validate = validationFunction.bind(this, schema);
        this.errors = null;
    }
}

class SimpleValidator extends Validator {
    constructor(schema) {
        super(simple, schema);
    }
}

class OneOfValidator extends Validator {
    constructor(schema) {
        super(oneOf, schema);
    }
}

function oneOf(schemas, data) {
    var schema = schemas[data[schemas.discriminator]];
    var result = false;

    if (schema) {
        result = schema(data);
        this.errors = schema.errors;
    } else {
        let error = new Error('should be equal to one of the allowed values');
        error.dataPath = '.' + schemas.discriminator;
        error.keyword = 'enum';
        error.params = {
            allowedValues: schemas.inheritance
        };
        error.schemaPath = '#/properties/' + schemas.discriminator;
        this.errors = [error];
    }

    return result;
}

function simple(ajvValidate, data) {
    var result = ajvValidate(data);
    this.errors = ajvValidate.errors;

    return result;
}

module.exports = {
    Validator: Validator,
    OneOfValidator: OneOfValidator,
    SimpleValidator: SimpleValidator
};