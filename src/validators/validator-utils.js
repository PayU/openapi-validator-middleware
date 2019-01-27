
module.exports = {
    allowedValuesError
};

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
