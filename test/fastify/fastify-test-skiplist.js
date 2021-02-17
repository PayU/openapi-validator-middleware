const fastify = require('fastify');
const chai = require('chai'),
    expect = chai.expect,
    chaiSinon = require('sinon-chai');
chai.use(chaiSinon);
const inputValidation = require('../../src/middleware');

describe('fastify plugin skiplist', () => {
    let app;
    before(() => {
        inputValidation.init('test/pet-store-swagger.yaml', {
            framework: 'fastify'
        });
    });

    beforeEach(async () => {
        app = fastify({ logger: true });

        app.register(inputValidation.validate({
            skiplist: {
                get: ['^/pets$']
            }
        }));
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

    it('POST fails if only GET validation is ignored', async () => {
        const response = await app.inject()
            .headers({
                'api-version': '1.0'
            })
            .body({
                age: true
            })
            .post('/pets');
        expect(response.statusCode).to.equal(400);
        expect(response.json()).to.eql({
            more_info: "[{\"keyword\":\"required\",\"dataPath\":\"\",\"schemaPath\":\"#/required\",\"params\":{\"missingProperty\":\"name\"},\"message\":\"should have required property 'name'\"},{\"keyword\":\"type\",\"dataPath\":\".age\",\"schemaPath\":\"#/properties/age/type\",\"params\":{\"type\":\"integer\"},\"message\":\"should be integer\"},{\"keyword\":\"required\",\"dataPath\":\"\",\"schemaPath\":\"#/required\",\"params\":{\"missingProperty\":\"test\"},\"message\":\"should have required property 'test'\"}]"
        });
    });

    it('Skips endpoint validation for request with multiple errors', async () => {
        const response = await app.inject().get('/pets');
        expect(response.statusCode).to.equal(204);
    });

    it('Skips endpoint validation for request with single error', async () => {
        const response = await app.inject()
            .headers({
                'api-version': '1.0'
            })
            .get('/pets');
        expect(response.statusCode).to.equal(204);
    });

    it('Correctly validates endpoint not in skiplist', async () => {
        const response = await app.inject().get('/pets/1');
        expect(response.statusCode).to.equal(400);
        expect(response.json()).to.eql({
            more_info: "[{\"keyword\":\"required\",\"dataPath\":\".headers\",\"schemaPath\":\"#/properties/headers/required\",\"params\":{\"missingProperty\":\"api-version\"},\"message\":\"should have required property 'api-version'\"},{\"keyword\":\"additionalProperties\",\"dataPath\":\".path\",\"schemaPath\":\"#/properties/path/additionalProperties\",\"params\":{\"additionalProperty\":\"*\"},\"message\":\"should NOT have additional properties\"},{\"keyword\":\"required\",\"dataPath\":\".path\",\"schemaPath\":\"#/properties/path/required\",\"params\":{\"missingProperty\":\"petId\"},\"message\":\"should have required property 'petId'\"}]"
        });
    });
});
