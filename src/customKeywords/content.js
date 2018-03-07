const Ajv = require('ajv');

module.exports = {
    validate: function filesValidation(schema, data) {
        filesValidation.errors = [];
        if (Number(data['content-length']) > 0) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(data['content-type'])) {
                filesValidation.errors.push(new Ajv.ValidationError({
                    keyword: 'content-type',
                    message: 'content-type must be one of ' + schema.types,
                    params: { pattern: schema.pattern, types: schema.types, 'content-type': data['content-type'], 'content-length': data['content-length'] }
                }));
                return false;
            }
        }

        return true;
    },
    errors: true
};