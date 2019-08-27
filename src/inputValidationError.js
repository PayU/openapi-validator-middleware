'use strict';

/**
 * Represent an input validation error
 * errors field will include the `ajv` error
 * @class InputValidationError
 * @extends {Error}
 */
class InputValidationError extends Error {
    constructor(errors, options = {}) {
        super('Input validation error');

        if (options.beautifyErrors && options.firstError) {
            this.errors = parseAjvError(errors[0]);
        } else if (options.beautifyErrors) {
            this.errors = parseAjvErrors(errors);
        } else {
            this.errors = errors;
        }
    }
}

const parseAjvError = function(error) {
    return `${buildDataPath(error)} ${buildMessage(error)}`;
};

const parseAjvErrors = function(errors) {
    return errors.map(parseAjvError);
};

const buildMessage = function(error){
    if (error.keyword === 'enum') {
        return `${error.message} [${error.params.allowedValues.toString()}]`;
    }

    if (error.keyword === 'additionalProperties') {
        return `${error.message} '${error.params.additionalProperty.toString()}'`;
    }

    if (error.validation) {
        return error.errors.message;
    }

    return error.message;
};

const buildDataPath = function(error) {
    if (error.dataPath.startsWith('.header')) {
        return error.dataPath
            .replace('.', '')
            .replace('[', '/')
            .replace(']', '')
            .replace('\'', '')
            .replace('\'', '');
    }

    if (error.dataPath.startsWith('.path')) {
        return error.dataPath
            .replace('.', '')
            .replace('.', '/');
    }

    if (error.dataPath.startsWith('.query')) {
        return error.dataPath
            .replace('.', '')
            .replace('.', '/');
    }

    if (error.dataPath.startsWith('.')) {
        return error.dataPath.replace('.', 'body/');
    }

    if (error.dataPath.startsWith('[')) {
        return `body/${error.dataPath}`;
    }

    if (error.dataPath === '') {
        return 'body';
    }

    return undefined;
};

module.exports = InputValidationError;
