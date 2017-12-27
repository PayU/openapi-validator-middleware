'use strict';

var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    chaiSinon = require('chai-sinon'),
    request = require('supertest');
chai.use(chaiSinon);

describe('input-validation middleware tests', function () {
    describe('init function tests', function () {
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
        var app;
        before(function () {
            return require('./test-simple-server').then(function (testServer) {
                app = testServer;
            });
        });
        it('valid request - should pass validation', function (done) {
            request(app)
                .get('/pets')
                .set('api-version', '1.0')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('missing header - should fail', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('api-version');
                    expect(res.body.more_info).to.includes('should have required property \'api-version\'');
                    done();
                });
        });
        it('bad header - invalid pattern', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '123456')
                .set('api-version', '1')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('api-version');
                    expect(res.body.more_info).to.includes('should match pattern');
                    done();
                });
        });
        it('bad header - empty header', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '')
                .set('api-version', '1.0')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('request-id');
                    expect(res.body.more_info).to.includes('should NOT be shorter than 1 characters');
                    done();
                });
        });
        it('bad body - wrong type', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123234')
                .set('api-version', '1.0')
                .send({
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('tag');
                    done();
                });
        });
        it('bad body - missing required params', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123324')
                .set('api-version', '1.0')
                .send({
                    tag: 'tag',
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('name');
                    done();
                });
        });
        it('bad body - missing required object attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123434')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('test');
                    done();
                });
        });
        it('bad body - wrong type object attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12334')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: ''
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('test');
                    done();
                });
        });
        it('bad body - missing required nested attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12343')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {}
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong format nested attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12343')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong enum value', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 'field1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('should be equal to one of the allowed values');
                    done();
                });
        });
        it('bad query param - missing required params', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 100 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('page');
                    done();
                });
        });
        it('bad query param - over limit', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 150, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('limit');
                    done();
                });
        });
        it('bad query param - under limit', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 0, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('limit');
                    done();
                });
        });
        it('bad path param - wrong format', function (done) {
            request(app)
                .get('/pets/12')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: '50', page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('petId');
                    done();
                });
        });
        it('bad body - wrong format nested attribute (not parameters)', function (done) {
            request(app)
                .put('/pets')
                .send([{
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(moreInfoAsJson.length).to.equal(2);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong format in array item body (second item)', function (done) {
            request(app)
                .put('/pets')
                .send([
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
                    }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('[1].test.field1');
                    done();
                });
        });
        it('bad body - wrong format body (should be an array)', function (done) {
            request(app)
                .put('/pets')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('should be array');
                    done();
                });
        });
    });
    describe('Simple server - with basePath', function () {
        var app;
        before(function () {
            return require('./test-simple-server-withBasePath').then(function (testServer) {
                app = testServer;
            });
        });
        it('valid request - should pass validation', function (done) {
            request(app)
                .get('/v1/pets')
                .set('api-version', '1.0')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('missing header - should fail', function (done) {
            request(app)
                .get('/v1/pets')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('api-version');
                    expect(res.body.more_info).to.includes('should have required property \'api-version\'');
                    done();
                });
        });
        it('bad header - invalid pattern', function (done) {
            request(app)
                .get('/v1/pets')
                .set('request-id', '123456')
                .set('api-version', '1')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('api-version');
                    expect(res.body.more_info).to.includes('should match pattern');
                    done();
                });
        });
        it('bad header - empty header', function (done) {
            request(app)
                .get('/v1/pets')
                .set('request-id', '')
                .set('api-version', '1.0')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('request-id');
                    expect(res.body.more_info).to.includes('should NOT be shorter than 1 characters');
                    done();
                });
        });
        it('bad body - wrong type', function (done) {
            request(app)
                .post('/v1/pets')
                .set('request-id', '123234')
                .set('api-version', '1.0')
                .send({
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('tag');
                    done();
                });
        });
        it('bad body - missing required params', function (done) {
            request(app)
                .post('/v1/pets')
                .set('request-id', '123324')
                .set('api-version', '1.0')
                .send({
                    tag: 'tag',
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('name');
                    done();
                });
        });
        it('bad body - missing required object attribute', function (done) {
            request(app)
                .post('/v1/pets')
                .set('request-id', '123434')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('test');
                    done();
                });
        });
        it('bad body - wrong type object attribute', function (done) {
            request(app)
                .post('/v1/pets')
                .set('request-id', '12334')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: ''
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('test');
                    done();
                });
        });
        it('bad body - missing required nested attribute', function (done) {
            request(app)
                .post('/v1/pets')
                .set('request-id', '12343')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {}
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong format nested attribute', function (done) {
            request(app)
                .post('/v1/pets')
                .set('request-id', '12343')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong enum value', function (done) {
            request(app)
                .post('/v1/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 'field1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('should be equal to one of the allowed values');
                    done();
                });
        });
        it('bad query param - missing required params', function (done) {
            request(app)
                .get('/v1/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 100 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('page');
                    done();
                });
        });
        it('bad query param - over limit', function (done) {
            request(app)
                .get('/v1/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 150, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('limit');
                    done();
                });
        });
        it('bad query param - under limit', function (done) {
            request(app)
                .get('/v1/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 0, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('limit');
                    done();
                });
        });
        it('bad path param - wrong format', function (done) {
            request(app)
                .get('/v1/pets/12')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: '50', page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('petId');
                    done();
                });
        });
        it('bad body - wrong format nested attribute (not parameters)', function (done) {
            request(app)
                .put('/v1/pets')
                .send([{
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(moreInfoAsJson.length).to.equal(2);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong format in array item body (second item)', function (done) {
            request(app)
                .put('/v1/pets')
                .send([
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
                    }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('[1].test.field1');
                    done();
                });
        });
        it('bad body - wrong format body (should be an array)', function (done) {
            request(app)
                .put('/v1/pets')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('should be array');
                    done();
                });
        });
    });
    describe('Simple server using routes', function () {
        var app;
        before(function () {
            return require('./test-simple-server-base-route').then(function (testServer) {
                app = testServer;
            });
        });
        it('valid request - should pass validation', function (done) {
            request(app)
                .get('/pets')
                .set('api-version', '1.0')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('missing header - should fail', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('api-version');
                    expect(res.body.more_info).to.includes('should have required property \'api-version\'');
                    done();
                });
        });
        it('bad header - invalid pattern', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '123456')
                .set('api-version', '1')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('api-version');
                    expect(res.body.more_info).to.includes('should match pattern');
                    done();
                });
        });
        it('bad header - empty header', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '')
                .set('api-version', '1.0')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('request-id');
                    expect(res.body.more_info).to.includes('should NOT be shorter than 1 characters');
                    done();
                });
        });
        it('bad body - wrong type', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123234')
                .set('api-version', '1.0')
                .send({
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('tag');
                    done();
                });
        });
        it('bad body - missing required params', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123324')
                .set('api-version', '1.0')
                .send({
                    tag: 'tag',
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('name');
                    done();
                });
        });
        it('bad body - missing required object attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123434')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('test');
                    done();
                });
        });
        it('bad body - wrong type object attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12334')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: ''
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('test');
                    done();
                });
        });
        it('bad body - missing required nested attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12343')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {}
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong format nested attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12343')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong enum value', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 'field1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('should be equal to one of the allowed values');
                    done();
                });
        });
        it('bad query param - missing required params', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 100 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('page');
                    done();
                });
        });
        it('bad query param - over limit', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 150, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('limit');
                    done();
                });
        });
        it('bad query param - under limit', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 0, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('limit');
                    done();
                });
        });
        it('bad path param - wrong format', function (done) {
            request(app)
                .get('/pets/12')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: '50', page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('petId');
                    done();
                });
        });
        it('bad body - wrong format nested attribute (not parameters)', function (done) {
            request(app)
                .put('/pets')
                .send([{
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(moreInfoAsJson.length).to.equal(2);
                    expect(res.body.more_info).to.includes('field1');
                    done();
                });
        });
        it('bad body - wrong format in array item body (second item)', function (done) {
            request(app)
                .put('/pets')
                .send([
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
                    }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('[1].test.field1');
                    done();
                });
        });
        it('bad body - wrong format body (should be an array)', function (done) {
            request(app)
                .put('/pets')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    let moreInfoAsJson = JSON.parse(res.body.more_info);
                    expect(moreInfoAsJson).to.be.instanceof(Array);
                    expect(res.body.more_info).to.includes('should be array');
                    done();
                });
        });
    });
    describe('Server with options - beautify and one error', function () {
        var app;
        before(function () {
            return require('./test-server-with-options').then(function (testServer) {
                app = testServer;
            });
        });
        it('valid request - should pass validation', function (done) {
            request(app)
                .get('/pets')
                .set('api-version', '1.0')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('missing header - should fail', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('headers should have required property \'api-version\'');
                    done();
                });
        });
        it('bad header - invalid pattern', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '123456')
                .set('api-version', '1')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('headers/api-version should match pattern "^\\d{1,3}\\.\\d{1,3}$"');
                    done();
                });
        });
        it('bad header - empty header', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '')
                .set('api-version', '1.0')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('headers/request-id should NOT be shorter than 1 characters');
                    done();
                });
        });
        it('bad body - wrong type', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .send({
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('body/tag should be string');
                    done();
                });
        });
        it('bad body - missing required params', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .send({
                    tag: 'tag',
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('body should have required property \'name\'');
                    done();
                });
        });
        it('bad body - missing required object attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12345')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('body should have required property \'test\'');
                    done();
                });
        });
        it('bad body - wrong type object attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12354')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: ''
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('body/test should be object');
                    done();
                });
        });
        it('bad body - missing required nested attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123345')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {}
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('body/test should have required property \'field1\'');
                    done();
                });
        });
        it('bad body - wrong format nested attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123435')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('body/test.field1 should be string');
                    done();
                });
        });
        it('bad body - wrong enum value', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123345')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 'field1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('body/test.field1 should be equal to one of the allowed values [enum1,enum2]');
                    done();
                });
        });
        it('bad query param - missing required params', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 100 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('query should have required property \'page\'');
                    done();
                });
        });
        it('bad query param - over limit', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 150, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('query/limit should be <= 100');
                    done();
                });
        });
        it('bad query param - under limit', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 0, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('query/limit should be >= 1');
                    done();
                });
        });
        it('bad path param - wrong format', function (done) {
            request(app)
                .get('/pets/12')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: '50', page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('path/petId should NOT be shorter than 3 characters');
                    done();
                });
        });
        it('bad body - wrong format nested attribute (not parameters)', function (done) {
            request(app)
                .put('/pets')
                .send([{
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.equal('body/[0].test.field1 should be string');
                    done();
                });
        });
        it('bad body - wrong format in array item body (second item)', function (done) {
            request(app)
                .put('/pets')
                .send([
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
                    }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.includes('body/[1].test.field1 should be string');
                    done();
                });
        });
        it('bad body - wrong format body (should be an array)', function (done) {
            request(app)
                .put('/pets')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('string');
                    expect(res.body.more_info).to.includes('body should be array');
                    done();
                });
        });
    });
    describe('Server with options - Only beautify errors', function () {
        var app;
        before(function () {
            return require('./test-server-with-options-more-than-1-error').then(function (testServer) {
                app = testServer;
            });
        });
        it('valid request - should pass validation', function (done) {
            request(app)
                .get('/pets')
                .set('api-version', '1.0')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('missing header - should fail', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '123456')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('headers should have required property \'api-version\'');
                    done();
                });
        });
        it('bad header - invalid pattern', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '123456')
                .set('api-version', '1')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('headers/api-version should match pattern "^\\d{1,3}\\.\\d{1,3}$"');
                    done();
                });
        });
        it('bad header - empty header', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '')
                .set('api-version', '1.0')
                .query({ page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('headers/request-id should NOT be shorter than 1 characters');
                    done();
                });
        });
        it('bad body & bad header', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '')
                .set('api-version', '1.0')
                .send({
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: 'enum1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info.length).to.equal(2);
                    expect(res.body.more_info[0]).to.includes('headers/request-id should NOT be shorter than 1 characters');
                    expect(res.body.more_info[1]).to.includes('body/tag should be string');
                    done();
                });
        });
        it('bad body - wrong type', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .send({
                    name: '111',
                    tag: 12344,
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body/tag should be string');
                    done();
                });
        });
        it('bad body - missing required params', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .send({
                    tag: 'tag',
                    'test': {
                        field1: '1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body should have required property \'name\'');
                    done();
                });
        });
        it('bad body - missing required object attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12345')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body should have required property \'test\'');
                    done();
                });
        });
        it('bad body - wrong type object attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '12354')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: ''
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body/test should be object');
                    done();
                });
        });
        it('bad body - missing required nested attribute', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123345')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {}
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body/test should have required property \'field1\'');
                    done();
                });
        });
        it('bad body - wrong format nested attribute (more than one error)', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123435')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body/test.field1 should be string');
                    expect(res.body.more_info[1]).to.includes('body/test.field1 should be equal to one of the allowed values [enum1,enum2]');
                    done();
                });
        });
        it('bad body - wrong enum value', function (done) {
            request(app)
                .post('/pets')
                .set('request-id', '123345')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 'field1'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body/test.field1 should be equal to one of the allowed values [enum1,enum2]');
                    done();
                });
        });
        it('bad query param - missing required params', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 100 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('query should have required property \'page\'');
                    done();
                });
        });
        it('bad query param - over limit', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 150, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('query/limit should be <= 100');
                    done();
                });
        });
        it('bad query param - under limit', function (done) {
            request(app)
                .get('/pets')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: 0, page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info).to.includes('query/limit should be >= 1');
                    done();
                });
        });
        it('bad path param - wrong format', function (done) {
            request(app)
                .get('/pets/12')
                .set('request-id', '1234')
                .set('api-version', '1.0')
                .query({ limit: '50', page: 0 })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('path/petId should NOT be shorter than 3 characters');
                    done();
                });
        });
        it('bad body - wrong format nested attribute (not parameters)', function (done) {
            request(app)
                .put('/pets')
                .send([{
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: 1234
                    }
                }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body/[0].test.field1 should be string');
                    done();
                });
        });
        it('bad body - wrong format in array item body (second item)', function (done) {
            request(app)
                .put('/pets')
                .send([
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
                    }])
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body/[1].test.field1 should be string');
                    done();
                });
        });
        it('bad body - wrong format body (should be an array)', function (done) {
            request(app)
                .put('/pets')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.be.a('array');
                    expect(res.body.more_info[0]).to.includes('body should be array');
                    done();
                });
        });
    });
    describe('Inheritance', function () {
        var app;
        before(function () {
            return require('./test-server-inheritance').then(function (testServer) {
                app = testServer;
            });
        });
        it('should pass', function (done) {
            request(app)
                .post('/pets')
                .set('api-version', '1.0')
                .send({
                    petType: 'Dog',
                    name: 'name',
                    packSize: 3
                })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('wrong value for header with enum definition', function (done) {
            request(app)
                .get('/pets')
                .set('api-version', '2.0')
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('headers/api-version should be equal to one of the allowed values [1.0,1.1]');
                    done();
                });
        });
        it('wrong value for query with enum definition', function (done) {
            request(app)
                .get('/pets')
                .set('api-version', '1.0')
                .query({ PetType: 'bird' })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('query/PetType should be equal to one of the allowed values [Dog,Cat]');
                    done();
                });
        });
        it('missing header with enum definition', function (done) {
            request(app)
                .get('/pets')
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('headers should have required property \'api-version\'');
                    done();
                });
        });
        it('wrong value for path param with enum definition', function (done) {
            request(app)
                .get('/v2/pets/12345')
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('path/version should be equal to one of the allowed values [v1]');
                    done();
                });
        });
        it('should fail for wrong value in discriminator', function (done) {
            request(app)
                .post('/pets')
                .set('api-version', '1.0')
                .send({
                    petType: 'dog',
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('body/petType should be equal to one of the allowed values [Cat,Dog]');
                    done();
                });
        });
        it('should fail for missing discriminator key', function (done) {
            request(app)
                .post('/pets')
                .set('api-version', '1.0')
                .send({
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('body/petType should be equal to one of the allowed values [Cat,Dog]');
                    done();
                });
        });
        it('should fail for missing attribute in inherited object (Dog)', function (done) {
            request(app)
                .post('/pets')
                .set('api-version', '1.0')
                .send({
                    petType: 'Dog',
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('body should have required property \'packSize\'');
                    done();
                });
        });
        it('should fail for missing attribute in inherited object (cat)', function (done) {
            request(app)
                .post('/pets')
                .set('api-version', '1.0')
                .send({
                    petType: 'Cat',
                    name: 'name',
                    tag: 'tag',
                    test: {
                        field1: '1234'
                    }
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('body should have required property \'huntingSkill\'');
                    done();
                });
        });
        it('should fail for missing attribute in inherited object (parent)', function (done) {
            request(app)
                .post('/pets')
                .set('api-version', '1.0')
                .send({
                    petType: 'Dog',
                    tag: 'tag',
                    chip_number: '123454'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.includes('body should have required property \'name\'');
                    done();
                });
        });
    });
});