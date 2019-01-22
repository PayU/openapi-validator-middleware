
const Validators = require('../validators'),
    Ajv = require('ajv'),
    ajvUtils = require('../utils/ajv-utils'),
    sourceResolver = require('../utils/sourceResolver');

module.exports = {
    getValidatedBodySchema,
    buildBodyValidation,
    buildParametersValidation
};

function getValidatedBodySchema(bodySchema) {
    let validatedBodySchema;
    if (bodySchema[0].in === 'body') {
        // if we are processing schema for a simple JSON payload, no additional processing needed
        validatedBodySchema = bodySchema[0].schema;
    } else if (bodySchema[0].in === 'formData') {
        // if we are processing multipart form, assemble body schema from form field schemas
        validatedBodySchema = {
            required: [],
            properties: {}
        };
        bodySchema.forEach((formField) => {
            if (formField.type !== 'file') {
                validatedBodySchema.properties[formField.name] = {
                    type: formField.type
                };
                if (formField.required) {
                    validatedBodySchema.required.push(formField.name);
                }
            }
        });
    }
    return validatedBodySchema;
}

function buildBodyValidation(schema, swaggerDefinitions, originalSwagger, currentPath, currentMethod, parsedPath, middlewareOptions = {}) {
    const defaultAjvOptions = {
        allErrors: true
        // unknownFormats: 'ignore'
    };
    const options = Object.assign({}, defaultAjvOptions, middlewareOptions.ajvConfigBody);
    let ajv = new Ajv(options);

    ajvUtils.addCustomKeyword(ajv, middlewareOptions.formats);

    if (schema.discriminator) {
        return buildInheritance(schema.discriminator, swaggerDefinitions, originalSwagger, currentPath, currentMethod, parsedPath, ajv);
    } else {
        return new Validators.SimpleValidator(ajv.compile(schema));
    }
}

function buildInheritance(discriminator, dereferencedDefinitions, swagger, currentPath, currentMethod, parsedPath, ajv) {
    let bodySchema = swagger.paths[currentPath][currentMethod].parameters.filter(function (parameter) { return parameter.in === 'body' })[0];
    var inheritsObject = {
        inheritance: []
    };
    inheritsObject.discriminator = discriminator;

    Object.keys(swagger.definitions).forEach(key => {
        if (swagger.definitions[key].allOf) {
            swagger.definitions[key].allOf.forEach(element => {
                if (element['$ref'] && element['$ref'] === bodySchema.schema['$ref']) {
                    inheritsObject[key] = ajv.compile(dereferencedDefinitions[key]);
                    inheritsObject.inheritance.push(key);
                }
            });
        }
    }, this);

    return new Validators.OneOfValidator(inheritsObject);
}

function createContentTypeHeaders(validate, contentTypes) {
    if (!validate || !contentTypes) return;

    return {
        types: contentTypes
    };
}

function buildParametersValidation(parameters, contentTypes,middlewareOptions) {
    const defaultAjvOptions = {
        allErrors: true,
        coerceTypes: 'array'
        // unknownFormats: 'ignore'
    };
    const options = Object.assign({}, defaultAjvOptions, middlewareOptions.ajvConfigParams);
    let ajv = new Ajv(options);

    ajvUtils.addCustomKeyword(ajv, middlewareOptions.formats);

    var ajvParametersSchema = {
        title: 'HTTP parameters',
        type: 'object',
        additionalProperties: false,
        properties: {
            headers: {
                title: 'HTTP headers',
                type: 'object',
                properties: {},
                additionalProperties: true
                // plural: 'headers'
            },
            path: {
                title: 'HTTP path',
                type: 'object',
                properties: {},
                additionalProperties: false
            },
            query: {
                title: 'HTTP query',
                type: 'object',
                properties: {},
                additionalProperties: false
            },
            files: {
                title: 'HTTP form files',
                files: {
                    required: [],
                    optional: []
                }
            }
        }
    };

    parameters.forEach(parameter => {
        var data = Object.assign({}, parameter);

        const required = parameter.required;
        const source = sourceResolver.resolveParameterSource(parameter);
        const key = parameter.in === 'header' ? parameter.name.toLowerCase() : parameter.name;

        var destination = ajvParametersSchema.properties[source];

        delete data.name;
        delete data.in;
        delete data.required;

        if (data.type === 'file') {
            required ? destination.files.required.push(key) : destination.files.optional.push(key);
        } else if (source !== 'fields') {
            if (required) {
                destination.required = destination.required || [];
                destination.required.push(key);
            }
            destination.properties[key] = data;
        }
    }, this);

    ajvParametersSchema.properties.headers.content = createContentTypeHeaders(middlewareOptions.contentTypeValidation, contentTypes);

    return ajv.compile(ajvParametersSchema);
}
