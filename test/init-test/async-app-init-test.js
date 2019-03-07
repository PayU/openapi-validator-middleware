'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const chaiSinon = require('chai-sinon');
const request = require('supertest');
const fs = require('fs');

chai.use(chaiSinon);

let inputValidationOptions = function () {
    return {
        formats: [
            { name: 'double', pattern: /\d+(\.\d+)?/ },
            { name: 'int64', pattern: /^\d{1,19}$/ },
            { name: 'int32', pattern: /^\d{1,10}$/ }
        ],
        beautifyErrors: true,
        firstError: false
    };
};
describe('When initializing the middleware asynchronously', function () {
    describe('And init succeeds', function () {
        before(function () {
            return require('./async-test-server-pet')(inputValidationOptions())
                .then((app) => {
                    this.app = app;
                });
        });
        it('valid pets', function () {
            return request(this.app)
                .get('/pets')
                .then(function (res) {
                    expect(res.status).to.equal(200);
                    expect(res.body.result).to.equal('OK');
                });
        });
        it('invalid dog', function () {
            request(this.app)
                .post('/pet')
                .set('public-key', '1.0')
                .send({
                    bark: 5
                })
                .then(function (res) {
                    expect(res.status).to.equal(400);
                    expect(res.body).to.eql({
                        'more_info': "[\"body/bark should be string\",\"body should have required property 'fur'\",\"body should match exactly one schema in oneOf\"]"
                    });
                });
        });
    });

    describe.skip('And init fails', function () {
        const msg = 'failed reading file';
        const sandbox = sinon.createSandbox();

        after(function () {
            sandbox.restore();
        });

        it('Should reject', async function () {
            sandbox.stub(fs, 'readFileSync').throws(msg);
            expect(await require('./async-test-server-pet')(inputValidationOptions())).to.throw(msg);
        });
    });
});
