const { expect } = require('chai');
const request = require('supertest');

describe('Simple server - custom formatters', () => {
    let app;
    before(() => {
        app = require('./test-simple-server-custom-formatters')();
    });
    it('should use custom formatter for thrown error', (done) => {
        request(app)
            .post('/pets')
            .set('request-id', '12334')
            .set('api-version', '1.0')
            .send({
                name: 'name',
                tag: 'tag',
                test: ''
            })
            .expect(400)
            .end((_err, res) => {
                expect(res.body).to.eql({
                    'errors': '[{"keyword":"type","dataPath":".test","schemaPath":"#/properties/test/type","params":{"type":"object"},"message":"should be object"}]',
                    'extraText': 'dummy-text',
                    'isCustom': true
                });
                done();
            });
    });
});
