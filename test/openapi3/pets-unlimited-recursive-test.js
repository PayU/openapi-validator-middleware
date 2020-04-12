'use strict';

const chai = require('chai'),
    expect = chai.expect,
    chaiSinon = require('sinon-chai');
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
describe('unlimited recursive swagger definitions', function () {
    it('should throw error on init', function () {
        try {
            require('./test-server-pet-recursive')(inputValidationOptions());
            throw new Error('should not get here');
        } catch (err) {
            expect(err.message).eql('swagger schema exceed maximum supported depth of 20 for swagger definitions inheritance');
        }
    });
});
