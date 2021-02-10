const chai = require('chai'),
    expect = chai.expect;
const sinon = require('sinon')
const apiSchemaBuilder = require('api-schema-builder');
const SchemaEndpointResolver = require('../../src/utils/schemaEndpointResolver');
const swaggerPath = 'test/openapi3/pets-parametrized.yaml';

describe('schemaEndpointResolver', () => {
    let schemas;
    let schemaEndpointResolver;
    before(() => {
        const schemaBuilderOptions = { buildRequests: true, buildResponses: true };
        return apiSchemaBuilder.buildSchema(swaggerPath, schemaBuilderOptions).then((receivedSchemas) => {
            schemas = receivedSchemas;
        });
    });
    beforeEach(() => {
        schemaEndpointResolver = new SchemaEndpointResolver();
    });

    it('memoizes resolved path correctly', () => {
        const spy = sinon.spy(Object, 'keys');
        const endpoint = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:petId', 'get');
        const endpoint2 = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:petId', 'get');
        expect(spy.callCount).to.equal(1);
        const endpoint3 = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:petId', 'put');
        const endpoint4 = schemaEndpointResolver.getMethodSchema(schemas, '/pets/:petId', 'put');
        expect(spy.callCount).to.equal(2);

        const endpoint5 = schemaEndpointResolver.getMethodSchema(schemas, '/pets', 'put');
        const endpoint6 = schemaEndpointResolver.getMethodSchema(schemas, '/pets', 'put');
        expect(spy.callCount).to.equal(4); // This invokes resolver twice, first for exact match, then for inexact

        sinon.restore();
        expect(endpoint).to.equal(endpoint2);
        expect(endpoint.body).to.equal(undefined);

        expect(endpoint).not.to.equal(endpoint3);
        expect(endpoint3).to.equal(endpoint4);
        expect(endpoint3.body).to.be.an('object');

        expect(endpoint5).to.equal(endpoint6);
        expect(endpoint5).to.equal(undefined);
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
