/**
 * Swagger 2.0 doesn't support multiple types, while JSON-Schema does. This method adds null as supported type for all non-required attributes
 * @param {Object} bodySchema
 */
function makeOptionalAttributesNullable(bodySchema) {
    if (!bodySchema || bodySchema.length === 0) {
        return;
    }

    for (let schemaEntry of bodySchema) {
        if (schemaEntry && schemaEntry.schema) {
            _processSchemaEntry(schemaEntry.schema);
        }
    }
}

function _processSchemaEntry(schema) {
    // if it is array, process schema of its entries
    if (!schema.properties && schema.items) {
        schema = schema.items;
    }

    if (!schema.properties) {
        return;
    }

    const properties = schema.properties;
    for (const property in properties) {
        if (properties.hasOwnProperty(property)) {
            if (!schema.required || schema.required.indexOf(property) === -1) {
                if (!Array.isArray(properties[property].type)) {
                    properties[property].type = [properties[property].type, 'null'];
                } else {
                    properties[property].type.push('null');
                }
            }
            // if property is an object and has its own properties, we need to process it recursively
            if (properties[property].properties) {
                _processSchemaEntry(properties[property]);
            }
        }
    }
}

module.exports = {
    makeOptionalAttributesNullable
};
