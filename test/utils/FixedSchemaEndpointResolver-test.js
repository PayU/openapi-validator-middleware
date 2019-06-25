const chai = require('chai'),
    expect = chai.expect;
const apiSchemaBuilder = require('api-schema-builder');
const FixedSchemaEndpointResolver = require('../../src/utils/FixedSchemaEndpointResolver');
const swaggerPath = 'test/openapi3/pets-parametrized.yaml';

describe('FixedSchemaEndpointResolver', () => {
    let schemas;
    let schemaEndpointResolver;
    before(() => {
        let schemaBuilderOptions = { buildRequests: true, buildResponses: true };
        return apiSchemaBuilder.buildSchema(swaggerPath, schemaBuilderOptions).then((receivedSchemas) => {
            schemas = receivedSchemas;
        });
    });
    beforeEach(() => {
        schemaEndpointResolver = new FixedSchemaEndpointResolver('/pets/:petId');
    });

    it('resolves exact path when route is not available correctly', () => {
        const endpoint = schemaEndpointResolver.getMethodSchema(schemas, undefined, 'get');
        expect(endpoint).to.be.ok;
    });

    it('overrides path correctly', () => {
        const endpoint = schemaEndpointResolver.getMethodSchema(schemas, '/dogs/:dogId', 'GET');
        expect(endpoint).to.be.ok;
    });

    it('resolves ignoring path parameter name', () => {
        schemaEndpointResolver = new FixedSchemaEndpointResolver('/pets/:id');
        const endpoint = schemaEndpointResolver.getMethodSchema(schemas, undefined, 'GET');
        expect(endpoint).to.be.ok;
    });

    it('uses method param to memoize result', () => {
        const endpointGet = schemaEndpointResolver.getMethodSchema(schemas, undefined, 'GET');
        expect(endpointGet.body).to.be.undefined;

        const endpointPut = schemaEndpointResolver.getMethodSchema(schemas, undefined, 'PUT');
        expect(endpointPut.body).to.be.ok;

        const endpointGet2 = schemaEndpointResolver.getMethodSchema(schemas, undefined, 'GET');
        expect(endpointGet2.body).to.be.undefined;
    });
});
