'use strict';

let chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    chaiSinon = require('sinon-chai'),
    InputValidationError = require('../../src/inputValidationError');
chai.use(chaiSinon);

describe('input-validation middleware tests', function () {
    describe('InputValidationError tests', function () {
        it('when beautifyErrors=true and error.dataPath scenario not handle', function () {
            const errors = [{
                'keyword': 'required',
                'dataPath': '432',
                'schemaPath': '#/properties/headers/required',
                'params': {
                    'missingProperty': 'api-version'
                },
                'message': "should have required property 'api-version'"
            }];
            const errorObj = new InputValidationError(errors, {beautifyErrors: true});
            expect(errorObj.errors[0]).to.equal('undefined should have required property \'api-version\'');
        });
    });
});
