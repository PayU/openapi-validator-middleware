'use strict';

let chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    chaiSinon = require('chai-sinon'),
    uuid = require('uuid'),
    request = require('supertest');
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
describe('input-validation middleware tests', function () {
    let app;

    describe('firstError=false', function () {
        before(function () {
            return require('./test-server-pet')(inputValidationOptions()).then(function (testServer) {
                app = testServer;
            });
        });
        it('valid pets', function (done) {
            request(app)
                .get('/pets')
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('valid dog', function (done) {
            request(app)
                .post('/pet')
                .set('public-key', '1.0')
                .send({
                    bark: 'hav hav'
                })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('invalid dog', function (done) {
            request(app)
                .post('/pet')
                .set('public-key', '1.0')
                .send({
                    bark: 5
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body).to.eql({
                        'more_info': "[\"body/bark should be string\",\"body should have required property 'fur'\",\"body should match exactly one schema in oneOf\"]"
                    });
                    done();
                });
        });
        it('valid cat', function (done) {
            request(app)
                .post('/pet')
                .set('public-key', '1.0')
                .send({
                    fur: '6'
                })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('Not uuid  pet id in path', function (done) {
            request(app)
                .get('/pets/not_uuid_value')
                .set('header_ref', uuid())
                .send({})
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.equal('["path/pet_id should match format \\"uuid\\""]');
                    done();
                });
        });
        it('Valid uuid pet id in path', function (done) {
            request(app)
                .get('/pets/c1745658-46a1-4653-9bb0-7846e6d8a522')
                .set('header_ref', uuid())
                .send({})
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body).to.eql({
                        'result': 'OK'
                    });
                    done();
                });
        });
        it('Valid uuid header_ref in header', function (done) {
            request(app)
                .get('/pets/c1745658-46a1-4653-9bb0-7846e6d8a522')
                .set('header_ref', 'not uuid value')
                .send({})
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.eql('["headers.header_ref should match format \\"uuid\\""]');
                    done();
                });
        });
        it('Valid uuid header_ref id required', function (done) {
            request(app)
                .get('/pets/c1745658-46a1-4653-9bb0-7846e6d8a522')
                .send({})
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.more_info).to.eql('["headers should have required property \'header_ref\'"]');
                    done();
                });
        });
        it('invalid cat', function (done) {
            // fail it is not match to two cases
            request(app)
                .post('/pet')
                .set('public-key', '1.0')
                .send({
                    fur: 'blabla'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body).to.eql({
                        'more_info': "[\"body should have required property 'bark'\",\"body/fur should match pattern \\\"^\\\\d+$\\\"\",\"body should match exactly one schema in oneOf\"]"
                    });
                    done();
                });
        });
        it('missing header public key', function (done) {
            request(app)
                .post('/pet')
                .send({
                    fur: '6'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body).to.eql({
                        'more_info': "[\"headers should have required property 'public-key'\"]"
                    });
                    done();
                });
        });
        it('when path does not exist in swagger - should not execute validation on request', function (done) {
            request(app)
                .post('/non-exist-path-in-swagger')
                .send({})
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body).to.eql({
                        'result': 'OK'
                    });
                    done();
                });
        });
        describe('discriminator-pet', function () {
            it('missing discriminator field', function (done) {
                request(app)
                    .post('/pet-discriminator')
                    .set('public-key', '1.0')
                    .send({
                        fur: '6'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'more_info': '["body/type should be equal to one of the allowed values [dog_object,cat_object]"]'
                        });
                        done();
                    });
            });

            it('when discriminator type is dog and missing field', function (done) {
                request(app)
                    .post('/pet-discriminator')
                    .set('public-key', '1.0')
                    .send({
                        type: 'dog_object'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'more_info': "[\"body should have required property 'bark'\"]"
                        });
                        done();
                    });
            });
        });
        describe('discriminator-multiple pet', function () {
            it('missing discriminator field on the root', function (done) {
                request(app)
                    .post('/pet-discriminator-multiple')
                    .set('public-key', '1.0')
                    .send({
                        fur: '200'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'more_info': '["body/type should be equal to one of the allowed values [dog_multiple,cat_object]"]'
                        });
                        done();
                    });
            });
            it('missing discriminator field on the on inside discriminator', function (done) {
                request(app)
                    .post('/pet-discriminator-multiple')
                    .set('public-key', '1.0')
                    .send({
                        bark: 'hav hav',
                        type: 'dog_multiple'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'more_info': '["body/model should be equal to one of the allowed values [small_dog,big_dog]"]'
                        });
                        done();
                    });
            });

            it('when discriminator type is dog_multiple and model small_dog and missing root field name and specific plane field', function (done) {
                request(app)
                    .post('/pet-discriminator-multiple')
                    .set('public-key', '1.0')
                    .send({
                        type: 'dog_multiple',
                        model: 'small_dog'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'more_info': "[\"body should have required property 'max_length'\",\"body should have required property 'name'\",\"body should have required property 'dog_age'\"]"
                        });
                        done();
                    });
            });

            it('when valid discriminator type is dog_multiple and model small_dog', function (done) {
                request(app)
                    .post('/pet-discriminator-multiple')
                    .set('public-key', '1.0')
                    .send({
                        name: 'sesna',
                        max_length: 'max_length',
                        dog_age: '3',
                        type: 'dog_multiple',
                        model: 'small_dog'
                    })
                    .expect(200, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'result': 'OK'
                        });
                        done();
                    });
            });
        });
        describe('discriminator-mapping pet', function () {
            it('missing discriminator field on the root', function (done) {
                request(app)
                    .post('/pet-discriminator-mapping')
                    .set('public-key', '1.0')
                    .send({
                        fur: '6'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'more_info': '["body/type should be equal to one of the allowed values [mapped_dog,mapped_cat]"]'
                        });
                        done();
                    });
            });

            it('when discriminator type is mapped_dog and model small_dog and missing root field name and specific dog field', function (done) {
                request(app)
                    .post('/pet-discriminator-mapping')
                    .set('public-key', '1.0')
                    .send({
                        type: 'mapped_dog',
                        model: 'small_dog'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'more_info': "[\"body should have required property 'max_length'\",\"body should have required property 'name'\",\"body should have required property 'dog_age'\"]"
                        });
                        done();
                    });
            });

            it('when valid discriminator type is mapped_dog and model small_dog', function (done) {
                request(app)
                    .post('/pet-discriminator-mapping')
                    .set('public-key', '1.0')
                    .send({
                        name: 'sesna',
                        max_length: 'max_length',
                        dog_age: '200',
                        type: 'mapped_dog',
                        model: 'small_dog'
                    })
                    .expect(200, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            'result': 'OK'
                        });
                        done();
                    });
            });
        });
        describe.skip('discriminator pet type is not on the root, only on child', function () {
            // does not support wright now.
        });
    });
    describe('firstError=true', function () {
        before(function () {
            const options = inputValidationOptions();
            options.firstError = true;
            return require('./test-server-pet')(options).then(function (testServer) {
                app = testServer;
            });
        });
        it('when discriminator type is mapped_dog and model small_dog and missing root field name and specific dog field', function (done) {
            request(app)
                .post('/pet-discriminator-mapping')
                .set('public-key', '1.0')
                .send({
                    type: 'mapped_dog',
                    model: 'small_dog'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body).to.eql({
                        'more_info': "\"body should have required property 'max_length'\""
                    });
                    done();
                });
        });
    });
});
