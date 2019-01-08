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

class DiscriminatorValidator extends Validator {
    constructor(schema) {
        super(discriminator, schema);
    }
}

function findSchemaValidation(tree, data) {
    const currentValue = tree.getValue();
    if (currentValue.discriminator){
        const discriminatorValue = data[currentValue.discriminator];
        if (!tree.getValue().allowedValues.includes(discriminatorValue)){
            allowedValuesError.call(this, currentValue.discriminator, currentValue.allowedValues);
            return;
        }
        if (tree.getValue().validators[discriminatorValue]){
            return tree.getValue().validators[discriminatorValue];
        }
        const newNode = tree.childrenAsKeyValue[discriminatorValue];
        return findSchemaValidation.call(this, newNode, data);
    }
    throw new Error('DEBUG: there is no discriminator on current value');
}

function allowedValuesError(discriminator, allowedValues) {
    let error = new Error('should be equal to one of the allowed values');
    error.dataPath = '.' + discriminator;
    error.keyword = 'enum';
    error.params = {
        allowedValues: allowedValues
    };
    error.schemaPath = '#/properties/' + discriminator;
    this.errors = [error];
}
function discriminator(schemas, data) {
    var schema = findSchemaValidation.call(this, schemas, data);
    var result = false;
    if (schema) {
        result = schema(data);
        this.errors = schema.errors;
    }

    return result;
}
function oneOf(schemas, data) {
    var schema = schemas[data[schemas.discriminator]];
    var result = false;
    if (schema) {
        result = schema(data);
        this.errors = schema.errors;
    } else {
        allowedValuesError.call(this, schemas.discriminator, schemas.inheritance);
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
    SimpleValidator: SimpleValidator,
    DiscriminatorValidator
};