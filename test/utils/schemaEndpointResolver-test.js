const chai = require('chai'),
    expect = chai.expect;
const apiSchemaBuilder = require('api-schema-builder');
const schemaEndpointResolver = require('../../src/utils/schemaEndpointResolver');
const swaggerPath = 'test/openapi3/pets-parametrized.yaml';

describe('schemaEndpointResolver', () => {
    let schemas;
    before(() => {
        let schemaBuilderOptions = { buildRequests: true, buildResponses: true };
        return apiSchemaBuilder.buildSchema(swaggerPath, schemaBuilderOptions).then((receivedSchemas) => {
            schemas = receivedSchemas;
        });
    });

    it('resolves exact path correctly', () => {
        const endpoint = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:petId', 'get');
        expect(endpoint).to.be.ok;
    });

    it('resolves using non-case-sensitive method', () => {
        const endpoint = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:petId', 'GET');
        expect(endpoint).to.be.ok;
    });

    it('resolves ignoring path parameter name', () => {
        const endpoint = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:id', 'GET');
        expect(endpoint).to.be.ok;
    });
});
