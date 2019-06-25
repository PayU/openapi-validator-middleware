const chai = require('chai'),
    expect = chai.expect;
const apiSchemaBuilder = require('api-schema-builder');
const SchemaEndpointResolver = require('../../src/utils/schemaEndpointResolver');
const swaggerPath = 'test/openapi3/pets-parametrized.yaml';

describe('schemaEndpointResolver', () => {
    let schemas;
    let schemaEndpointResolver;
    before(() => {
        let schemaBuilderOptions = {buildRequests: true, buildResponses: true};
        return apiSchemaBuilder.buildSchema(swaggerPath, schemaBuilderOptions).then((receivedSchemas) => {
            schemas = receivedSchemas;
        });
    });
    beforeEach(() => {
        schemaEndpointResolver = new SchemaEndpointResolver();
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

    it('uses all three params to memoize result', () => {
        const endpointGet = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:id', 'GET');
        expect(endpointGet.body).to.be.undefined;

        const endpointPut = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:id', 'PUT');
        expect(endpointPut.body).to.be.ok;

        const endpointGet2 = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:id', 'GET');
        expect(endpointGet2.body).to.be.undefined;
    });
});
