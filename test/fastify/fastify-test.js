const fastify = require('fastify');
const chai = require('chai'),
    expect = chai.expect,
    chaiSinon = require('sinon-chai');
chai.use(chaiSinon);
const inputValidation = require('../../src/middleware');

describe('fastify plugin', () => {
    let app;
    before(() => {
        inputValidation.init('test/pet-store-swagger.yaml', {
            framework: 'fastify'
        });
    });

    beforeEach(async () => {
        app = fastify({ logger: true });

        app.register(inputValidation.validate());
        app.setErrorHandler(async (err, req, reply) => {
            if (err instanceof inputValidation.InputValidationError) {
                return reply.status(400).send({ more_info: JSON.stringify(err.errors) });
            }

            reply.status(500);
            reply.send();
        });

        app.get('/pets', (req, reply) => {
            reply.status(204).send();
        });
        
        app.get('/pets/:petId/medicalHistory', (req, reply) => {
            reply.status(204).send();
        });

        app.post('/pets', (req, reply) => {
            reply.status(201).send();
        });

        await app.ready();
    });

    afterEach(() => {
        return app.close();
    });

    it('Accepts simple GET', async () => {
        const response = await app.inject()
            .headers({
                'api-version': '1.0'
            })
            .query({
                page: 1
            })
            .get('/pets');
        expect(response.statusCode).to.equal(204);
        expect(response.body).to.eql('');
    });

    it('Returns an error on invalid GET request with multiple errors', async () => {
        const response = await app.inject().get('/pets');
        expect(response.statusCode).to.equal(400);
        expect(response.json()).to.eql({
            more_info: "[{\"keyword\":\"required\",\"dataPath\":\".headers\",\"schemaPath\":\"#/properties/headers/required\",\"params\":{\"missingProperty\":\"api-version\"},\"message\":\"should have required property 'api-version'\"},{\"keyword\":\"required\",\"dataPath\":\".query\",\"schemaPath\":\"#/properties/query/required\",\"params\":{\"missingProperty\":\"page\"},\"message\":\"should have required property 'page'\"}]"
        });
    });

    it('Returns an error on invalid GET request with single error', async () => {
        const response = await app.inject()
            .headers({
                'api-version': '1.0'
            })
            .get('/pets');
        expect(response.statusCode).to.equal(400);
        expect(response.json()).to.eql({
            more_info: "[{\"keyword\":\"required\",\"dataPath\":\".query\",\"schemaPath\":\"#/properties/query/required\",\"params\":{\"missingProperty\":\"page\"},\"message\":\"should have required property 'page'\"}]"
        });
    });

    it('Correctly matches endpoint with query params', async () => {
        const response = await app.inject()
            .headers({
                'api-version': '1.0'
            })
            .query({
                dummy: 1
            })
            .get('/pets');
        expect(response.statusCode).to.equal(400);
        expect(response.json()).to.eql({
            more_info: "[{\"keyword\":\"additionalProperties\",\"dataPath\":\".query\",\"schemaPath\":\"#/properties/query/additionalProperties\",\"params\":{\"additionalProperty\":\"dummy\"},\"message\":\"should NOT have additional properties\"},{\"keyword\":\"required\",\"dataPath\":\".query\",\"schemaPath\":\"#/properties/query/required\",\"params\":{\"missingProperty\":\"page\"},\"message\":\"should have required property 'page'\"}]"
        });
    });

    it('Accepts a valid POST request', async () => {
        const response = await app.inject()
            .payload({
                name: 'A new pet',
                test: { field1: 'enum1' }
            }).post('/pets');
        expect(response.statusCode).to.equal(201);
    });

    it('Returns an error on invalid POST request with error', async () => {
        const response = await app.inject()
            .payload({
                name: 'A new pet',
                test: 'field1'
            }).post('/pets');
        expect(response.statusCode).to.equal(400);
    });
    it('Invalid path parameter - too short', async () => {
        const response = await app.inject()
            .headers({
                'api-version': '1.0'
            })
            .get('/pets/11/medicalHistory');
        expect(response.statusCode).to.equal(400);
        console.log(response);
    });
    it('Invalid path parameter - empty', async () => {
        const response = await app.inject()
            .headers({
                'api-version': '1.0'
            })
            .get('/pets//medicalHistory');
        expect(response.statusCode).to.equal(400);
        console.log(response);
    });
});
