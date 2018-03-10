'use strict';

/**
 * Represent an input validation error
 * errors field will include the `ajv` error
 * @class InputValidationError
 * @extends {Error}
 */
class InputValidationError extends Error {
    constructor(errors, path, method, options) {
        super('Input validation error');

        if (options.beautifyErrors && options.firstError) {
            this.errors = this.parseAjvError(errors[0], path, method);
        } else if (options.beautifyErrors) {
            this.errors = this.parseAjvErrors(errors, path, method);
        } else {
            this.errors = errors;
        }
    }

    parseAjvErrors(errors, path, method) {
        var parsedError = [];
        errors.forEach(function (error) {
            parsedError.push(this.parseAjvError(error, path, method));
        }, this);

        return parsedError;
    }

    parseAjvError(error, path, method) {
        if (error.dataPath.startsWith('.header')) {
            error.dataPath = error.dataPath.replace('.', '');
            error.dataPath = error.dataPath.replace('[', '/');
            error.dataPath = error.dataPath.replace(']', '');
            error.dataPath = error.dataPath.replace('\'', '');
            error.dataPath = error.dataPath.replace('\'', '');
        }

        if (error.dataPath.startsWith('.path')) {
            error.dataPath = error.dataPath.replace('.', '');
            error.dataPath = error.dataPath.replace('.', '/');
        }

        if (error.dataPath.startsWith('.query')) {
            error.dataPath = error.dataPath.replace('.', '');
            error.dataPath = error.dataPath.replace('.', '/');
        }

        if (error.dataPath.startsWith('.')) {
            error.dataPath = error.dataPath.replace('.', 'body/');
        }

        if (error.dataPath.startsWith('[')) {
            error.dataPath = `body/${error.dataPath}`;
        }

        if (error.dataPath === '') {
            error.dataPath = 'body';
        }

        if (error.keyword === 'enum') {
            error.message += ` [${error.params.allowedValues.toString()}]`;
        }

        if (error.validation) {
            error.message = error.errors.message;
        }

        return `${error.dataPath} ${error.message}`;
    }
}

module.exports = InputValidationError;