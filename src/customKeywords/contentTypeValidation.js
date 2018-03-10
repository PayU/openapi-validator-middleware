const Ajv = require('ajv');

module.exports = {
    compile: function contentTypeValidation(schema) {
        const regex = buildContentTypeRegex(schema.types);
        return function contentValidation(data) {
            contentValidation.errors = [];
            if (Number(data['content-length']) > 0) {
                if (!regex.test(data['content-type'])) {
                    contentValidation.errors.push(new Ajv.ValidationError({
                        keyword: 'content-type',
                        message: 'content-type must be one of ' + schema.types,
                        params: { pattern: schema.pattern, types: schema.types, 'content-type': data['content-type'], 'content-length': data['content-length'] }
                    }));
                    return false;
                }
            }
            return true;
        };
    },
    errors: true
};

function buildContentTypeRegex(contentTypes) {
    let pattern = '';
    contentTypes.forEach(type => {
        pattern += `(${type.replace(/\//g, '\\/')}.*\\s*\\S*)|`;
    });

    return new RegExp(pattern.substring(0, pattern.length - 1));
}