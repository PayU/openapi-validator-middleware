'use strict';

const chai = require('chai'),
    expect = chai.expect,
    chaiSinon = require('sinon-chai'),
    request = require('supertest'),
    inputValidation = require('../../src/middleware');
chai.use(chaiSinon);

const inputValidationOptions = function () {
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
            app = require('./test-server-pet')(inputValidationOptions());
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
                        more_info: "[\"body/bark should be string\",\"body should have required property 'fur'\",\"body should match exactly one schema in oneOf\"]"
                    });
                    done();
                });
        });
        it('validate depending on content-type -- valid dog', function (done) {
            request(app)
                .post('/pet')
                .set('public-key', '1.0')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    bark: 'foo'
                })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
                    done();
                });
        });
        it('validate depending on content-type -- invalid dog', function (done) {
            request(app)
                .post('/pet')
                .set('public-key', '1.0')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({
                    bark: 'not foo'
                })
                .expect(400, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body).to.deep.equal({
                        more_info: '["body/bark should be equal to one of the allowed values [foo,bar]","body should have required property \'fur\'","body should match exactly one schema in oneOf"]'
                    });
                    done();
                });
        });
        it('resolves content type for content-type with charset', function (done) {
            request(app)
                .post('/pet')
                .set('public-key', '1.0')
                .set('content-type', 'application/x-www-form-urlencoded; charset=utf-8')
                .send({
                    bark: 'foo'
                })
                .expect(200, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    expect(res.body.result).to.equal('OK');
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
                        more_info: "[\"body should have required property 'bark'\",\"body/fur should match pattern \\\"^\\\\d+$\\\"\",\"body should match exactly one schema in oneOf\"]"
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
                        more_info: "[\"headers should have required property 'public-key'\"]"
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
                        result: 'OK'
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
                            more_info: '["body/type should be equal to one of the allowed values [dog_object,cat_object]"]'
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
                            more_info: "[\"body should have required property 'bark'\"]"
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
                            more_info: '["body/type should be equal to one of the allowed values [dog_multiple,cat_object]"]'
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
                            more_info: '["body/model should be equal to one of the allowed values [small_dog,big_dog]"]'
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
                            more_info: "[\"body should have required property 'max_length'\",\"body should have required property 'name'\",\"body should have required property 'dog_age'\"]"
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
                            result: 'OK'
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
                            more_info: '["body/type should be equal to one of the allowed values [mapped_dog,mapped_cat]"]'
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
                            more_info: "[\"body should have required property 'max_length'\",\"body should have required property 'name'\",\"body should have required property 'dog_age'\"]"
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
                            result: 'OK'
                        });
                        done();
                    });
            });
        });
        describe('additionalProperties flag false', function () {
            it('invalid update when body contains properties which are not in schema', function (done) {
                request(app)
                    .put('/dog/1')
                    .set('public-key', '1.0')
                    .send({
                        max_length: '10',
                        min_length: '5',
                        additional1: '1',
                        additional2: '2'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            more_info: JSON.stringify(
                                [
                                    "body should NOT have additional properties 'additional1'",
                                    "body should NOT have additional properties 'additional2'"])
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
            app = require('./test-server-pet')(options);
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
                        more_info: "\"body should have required property 'max_length'\""
                    });
                    done();
                });
        });
        describe('additionalProperties flag false', function () {
            it('invalid update when body contains properties which are not in schema', function (done) {
                request(app)
                    .put('/dog/1')
                    .set('public-key', '1.0')
                    .send({
                        max_length: '10',
                        min_length: '5',
                        additional1: '1',
                        additional2: '2'
                    })
                    .expect(400, function (err, res) {
                        if (err) {
                            throw err;
                        }
                        expect(res.body).to.eql({
                            more_info: JSON.stringify(
                                "body should NOT have additional properties 'additional1'")
                        });
                        done();
                    });
            });
        });
    });
    describe('support multi instances', function (){
        before(function (){
            app = require('./test-server-validator-instance')(inputValidationOptions());
        });

        describe('when running server with two seperated yaml one with get and other with post - should make validator per each yaml', function (){
            it('verify two instances has two different schemas', function (){
                const inputValidationWithGet = inputValidation.getNewMiddleware(`${__dirname}/pets-instance1.yaml`);
                const inputValidationWithPost = inputValidation.getNewMiddleware(`${__dirname}/pets-instance2.yaml`);
                expect(JSON.stringify(inputValidationWithGet.schemas)).eql('{"/pets":{"get":{"parameters":{"errors":null}}}}');
                expect(JSON.stringify(inputValidationWithPost.schemas)).eql('{"/pets":{"post":{"body":{"errors":null,"application/json":{"errors":null},"application/x-www-form-urlencoded":{"errors":null}},"parameters":{"errors":null}}}}');
            });
            it('get pets from pets-instance1.yaml', function (done){
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

            it('post pets from pets-instance2.yaml', function (done){
                request(app)
                    .post('/pets')
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
        });
    });
});
