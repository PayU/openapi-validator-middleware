
const Validator = require('./Validator'),
    validatorUtils = require('./validator-utils');

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
            validatorUtils.allowedValuesError.call(this, currentValue.discriminator, currentValue.allowedValues);
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

module.exports = DiscriminatorValidator;
