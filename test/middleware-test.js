'use strict';

var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    chaiSinon = require('chai-sinon'),
    request = require('request-promise-native');
chai.use(chaiSinon);

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
    describe('Simple server - no options', function () {
        var server;
        before(function () {
            return require('./test-simple-server').then(function(testServer) {
                server = testServer;
            });
        });
        after(function () {
            server.close();
        });
        it('valid request - should pass validation', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                uri: 'http://localhost:8281/pets',
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
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('api-version');
                expect(err.response.body.more_info).to.includes('should have required property \'api-version\'');
            });
        });
        it('bad header - invalid pattern', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('api-version');
                expect(err.response.body.more_info).to.includes('should match pattern');
            });
        });
        it('bad header - empty header', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('request-id');
                expect(err.response.body.more_info).to.includes('should NOT be shorter than 1 characters');
            });
        });
        it('bad body - wrong type', function() {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: '1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('tag');
            });
        });
        it('bad body - missing required params', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    tag: 'tag',
                    'test': {
                        field1: '1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('name');
            });
        });
        it('bad body - missing required object attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    name: 'name',
                    tag: 'tag'
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('test');
            });
        });
        it('bad body - wrong type object attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: ''
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('test');
            });
        });
        it('bad body - missing required nested attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {}
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('field1');
            });
        });
        it('bad body - wrong format nested attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '123435'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(moreInfoAsJson.length).to.equal(2);
                expect(err.response.body.more_info).to.includes('field1');
            });
        });
        it('bad body - wrong enum value', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 'field1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('should be equal to one of the allowed values');
            });
        });
        it('bad query param - missing required params', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
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
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('page');
            });
        });
        it('bad query param - over limit', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '123456'
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
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('limit');
            });
        });
        it('bad query param - under limit', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '123455'
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
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('limit');
            });
        });
        it('bad path param - wrong format', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets/12',
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
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('petId');
            });
        });
        it('bad body - wrong format nested attribute (not parameters)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: [{
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                }],
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(moreInfoAsJson.length).to.equal(2);
                expect(err.response.body.more_info).to.includes('field1');
            });
        });
        it('bad body - wrong format in array item body (second item)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: [
                    {
                        name: 'name',
                        tag: 'tag',
                        test: {
                            field1: 'enum1'
                        }
                    },
                    {
                        name: 'name',
                        tag: 'tag',
                        test: {
                            field1: 1234
                        }
                    }],
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('[1].test.field1');
            });
        });
        it('bad body - wrong format body (should be an array)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                let moreInfoAsJson = JSON.parse(err.response.body.more_info);
                expect(moreInfoAsJson).to.be.instanceof(Array);
                expect(err.response.body.more_info).to.includes('should be array');
            });
        });
    });
    describe('Server with options - beautify and one error', function () {
        var server;
        before(function () {
            return require('./test-server-with-options').then(function(testServer) {
                server = testServer;
            });
        });
        after(function () {
            server.close();
        });
        it('valid request - should pass validation', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                uri: 'http://localhost:8281/pets',
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
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('headers should have required property \'api-version\'');
            });
        });
        it('bad header - invalid pattern', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('headers/api-version should match pattern "^\\d{1,3}\\.\\d{1,3}$"');
            });
        });
        it('bad header - empty header', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('headers/request-id should NOT be shorter than 1 characters');
            });
        });
        it('bad body - wrong type', function() {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12356'
                },
                body: {
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: '1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('body/tag should be string');
            });
        });
        it('bad body - missing required params', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12356'
                },
                body: {
                    tag: 'tag',
                    test: {
                        field1: '1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('body should have required property \'name\'');
            });
        });
        it('bad body - missing required object attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '1234566'
                },
                body: {
                    name: 'name',
                    tag: 'tag'
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('body should have required property \'test\'');
            });
        });
        it('bad body - wrong type object attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12356'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: ''
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('body/test should be object');
            });
        });
        it('bad body - missing required nested attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '1244366'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {}
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('body/test should have required property \'field1\'');
            });
        });
        it('bad body - wrong format nested attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '1233564'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('body/test.field1 should be string');
            });
        });
        it('bad body - wrong enum value', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '123546'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 'field1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('body/test.field1 should be equal to one of the allowed values [enum1,enum2]');
            });
        });
        it('bad query param - missing required params', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
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
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('query should have required property \'page\'');
            });
        });
        it('bad query param - over limit', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12345'
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
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('query/limit should be <= 100');
            });
        });
        it('bad query param - under limit', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12345'
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
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('query/limit should be >= 1');
            });
        });
        it('bad path param - wrong format', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets/12',
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
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('path/petId should NOT be shorter than 3 characters');
            });
        });
        it('bad body - wrong format nested attribute (not parameters)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: [{
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                }],
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.equal('body/[0].test.field1 should be string');
            });
        });
        it('bad body - wrong format in array item body (second item)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: [
                    {
                        name: 'name',
                        tag: 'tag',
                        test: {
                            field1: 'enum1'
                        }
                    },
                    {
                        name: 'name',
                        tag: 'tag',
                        test: {
                            field1: 1234
                        }
                    }],
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.includes('body/[1].test.field1 should be string');
            });
        });
        it('bad body - wrong format body (should be an array)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('string');
                expect(err.response.body.more_info).to.includes('body should be array');
            });
        });
    });
    describe('Server with options - Only beautify errors', function () {
        var server;
        before(function () {
            return require('./test-server-with-options-more-than-1-error').then(function(testServer) {
                server = testServer;
            });
        });
        after(function () {
            server.close();
        });
        it('valid request - should pass validation', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                uri: 'http://localhost:8281/pets',
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
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('headers should have required property \'api-version\'');
            });
        });
        it('bad header - invalid pattern', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('headers/api-version should match pattern "^\\d{1,3}\\.\\d{1,3}$"');
            });
        });
        it('bad header - empty header', function () {
            return request({
                uri: 'http://localhost:8281/pets',
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
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('headers/request-id should NOT be shorter than 1 characters');
            });
        });
        it('bad body & bad header', function() {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': ''
                },
                body: {
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: 'enum1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info.length).to.equal(2);
                expect(err.response.body.more_info[0]).to.includes('headers/request-id should NOT be shorter than 1 characters');
                expect(err.response.body.more_info[1]).to.includes('body/tag should be string');
            });
        });
        it('bad body - wrong type', function() {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '1234'
                },
                body: {
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: '1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body/tag should be string');
            });
        });
        it('bad body - missing required params', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12345'
                },
                body: {
                    tag: 'tag',
                    test: {
                        field1: '1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body should have required property \'name\'');
            });
        });
        it('bad body - missing required object attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12345'
                },
                body: {
                    name: 'name',
                    tag: 'tag'
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body should have required property \'test\'');
            });
        });
        it('bad body - wrong type object attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '123465'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: ''
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body/test should be object');
            });
        });
        it('bad body - missing required nested attribute', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12321456'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {}
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body/test should have required property \'field1\'');
            });
        });
        it('bad body - wrong format nested attribute (more than one error)', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '1234345'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body/test.field1 should be string');
                expect(err.response.body.more_info[1]).to.includes('body/test.field1 should be equal to one of the allowed values [enum1,enum2]');
            });
        });
        it('bad body - wrong enum value', function () {
            return request({
                method: 'POST',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '123566'
                },
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 'field1'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body/test.field1 should be equal to one of the allowed values [enum1,enum2]');
            });
        });
        it('bad query param - missing required params', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
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
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('query should have required property \'page\'');
            });
        });
        it('bad query param - over limit', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12345'
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
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('query/limit should be <= 100');
            });
        });
        it('bad query param - under limit', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets',
                headers: {
                    'api-version': '1.0',
                    'request-id': '12345'
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
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info).to.includes('query/limit should be >= 1');
            });
        });
        it('bad path param - wrong format', function () {
            return request({
                method: 'GET',
                uri: 'http://localhost:8281/pets/12',
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
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('path/petId should NOT be shorter than 3 characters');
            });
        });
        it('bad body - wrong format nested attribute (not parameters)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: [{
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                }],
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body/[0].test.field1 should be string');
            });
        });
        it('bad body - wrong format in array item body (second item)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: [
                    {
                        name: 'name',
                        tag: 'tag',
                        test: {
                            field1: 'enum1'
                        }
                    },
                    {
                        name: 'name',
                        tag: 'tag',
                        test: {
                            field1: 1234
                        }
                    }],
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body/[1].test.field1 should be string');
            });
        });
        it('bad body - wrong format body (should be an array)', function () {
            return request({
                method: 'PUT',
                uri: 'http://localhost:8281/pets',
                body: {
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                },
                qs: null,
                json: true
            }).then(function (res) {
                expect.fail(res, 'should fail', 'request should fail with status 400');
            }).catch(function (err) {
                expect(err.statusCode).to.equal(400);
                expect(err.response.body.more_info).to.be.a('array');
                expect(err.response.body.more_info[0]).to.includes('body should be array');
            });
        });
    });
});