'use strict';

var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    chaiSinon = require('chai-sinon'),
    request = require('request-promise-native');
chai.use(chaiSinon);

require('./test-server');

describe('input-validation middleware tests', function () {
    describe('init function tests', function() {
        it('should reject the promise in case the file doesn\'t exists', function () {
            let rewire = require('rewire');
            let middleware = rewire('../src/middleware');
            return middleware.init('test/pet-store-swagger1.yaml')
                .catch(function (err) {
                    expect(err).to.exist;
                });
        });
        it('should resolve without formats', function () {
            let rewire = require('rewire');
            let middleware = rewire('../src/middleware');
            let addFormats = middleware.__get__('addFormats');
            let addFormatsSpy = sinon.spy(addFormats);
            return middleware.init('test/pet-store-swagger.yaml')
                .then(function () {
                    expect(addFormatsSpy).to.have.not.been.called;
                });
        });
    });
    describe('Valid headers request should pass', function () {
        it('valid request - should pass validation', function () {
            return request({
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '123456'
                },
                qs: {
                    page: 0
                },
                json: true
            }).then(function (res) {
                expect(res.result).to.equal('OK');
            }).catch(function (err) {
                throw err;
            });
        });
        it('missing header - should fail', function () {
            return request({
                uri: 'http://localhost:3000/pets',
                headers: {
                    'request-id': '123456'
                },
                qs: {
                    page: 0
                },
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('api-version');
                expect(err.response.body.more_info).to.includes('should have required property \'api-version\'');
            });
        });
        it('bad header - invalid pattern', function () {
            return request({
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1',
                    'request-id': '123456'
                },
                qs: {
                    page: 0
                },
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('api-version');
                expect(err.response.body.more_info).to.includes('should match pattern');
            });
        });
        it('bad header - empty header', function () {
            return request({
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                qs: {
                    page: 0
                },
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('should NOT be shorter than 1 characters');
            });
        });
        it('bad body - wrong type', function() {
            return request({
                method: 'POST',
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    name: '111',
                    tag: 12344
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('tag');
            });
        });
        it('bad body - missing required params', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    tag: 'tag'
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('name');
            });
        });
        it('bad query param - missing required params', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '1234'
                },
                qs: {
                    limit: 100
                },
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('page');
            });
        });
        it('bad query param - over limit', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                qs: {
                    limit: 150,
                    page: 0
                },
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('limit');
            });
        });
        it('bad query param - under limit', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                qs: {
                    limit: 0,
                    page: 0
                },
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('limit');
            });
        });
        it('bad query param - wrong type', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:3000/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                qs: {
                    limit: '50',
                    page: 0
                },
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('limit');
            });
        });
        it('bad path param - wrong format', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:3000/pets/12',
                headers: {
                    'api-version': '1.0',
                    'request-id': '1234'
                },
                qs: {
                    limit: '50',
                    page: 0
                },
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.includes('petId');
            });
        });
    });
});