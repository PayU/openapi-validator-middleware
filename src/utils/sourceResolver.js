/**
 * Resolve value source for a given schema parameter
 * @param {Object} parameter from Swagger schema
 * @returns {string}
 */
function resolveParameterSource(parameter) {
    if (parameter.in === 'formData') {
        if (parameter.type === 'file') {
            return 'files';
        } else {
            return 'fields';
        }
    } else if (parameter.in === 'header') {
        return 'headers';
    }

    return parameter.in;
}

module.exports = {
    resolveParameterSource
};
