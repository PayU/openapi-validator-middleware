
module.exports = {
    oneOf,
    simple,
    discriminator
};

function simple(ajvValidate, data) {
    let result = ajvValidate(data);
    this.errors = ajvValidate.errors;

    return result;
}

function oneOf(schemas, data) {
    let schema = schemas[data[schemas.discriminator]];
    let result = false;
    if (schema) {
        result = schema(data);
        this.errors = schema.errors;
    } else {
        allowedValuesError.call(this, schemas.discriminator, schemas.inheritance);
    }

    return result;
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

function discriminator(schemas, data) {
    let schema = findSchemaValidation.call(this, schemas, data);
    let result = false;
    if (schema) {
        result = schema(data);
        this.errors = schema.errors;
    }

    return result;
}
