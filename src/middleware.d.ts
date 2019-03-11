/// <reference path="./middleware.js" />

/**
 * Initialize the input validation middleware by
 * providing it with the swagger file path and
 * configuration options. This function should be called 
 * before using `validate` middleware.
 * @param {string} swaggerPath - the path for the swagger file
 * @param {ajvValidatorOptions} options - ajv swagger validator options
 */
export function init(swaggerPath: string, options?: ajvValidatorOptions): Promise<void>

/**
 * Middleware that validates the request against the swagger
 * file, according to the request method and route
 * @param {object} req 
 * @param {object} res 
 * @param {Function} next
 */
export function validate(req: object, res: object, next: Function): void

/**
 * Error of type input validation
 * 
 * @param {Array<string>} errors - array of the error messages
 * @param {string} path  - request path
 * @param {string} method - request method
 * @param {inputValidationOptions} options - input validation error options
 * 
 * @returns {InputValidationError} input validation error
 */
export function InputValidationError(errors: Array<string>, path?: string, method?: string, options?: inputValidationOptions): InputValidationError
interface InputValidationError extends Error {
    errors: Array<string>;
}

export enum frameworks {
    koa,
    express
}

export interface format {
    name: string;
    pattern: string;
}

export interface ajvValidatorOptions {
    ajvConfigBody?: object;
    ajvConfigParams?: object;
    beautifyErrors?: boolean;
    contentTypeValidation?: boolean;
    expectFormFieldsInBody?: boolean;
    firstError?: boolean;
    framework?: frameworks;
    formats?: Array<format>;
    keywords?: any;
    makeOptionalAttributesNullable?: boolean;
}
export let AjvValidatorOptions: AjvValidatorOptionsStatic;
export interface AjvValidatorOptionsStatic {
    new(options?: ajvValidatorOptions): AjvValidatorOptions;
}

let InputValidationOptions: InputValidationOptionsStatic;
export interface inputValidationOptions {
    beautifyErrors?: boolean;
    firstError?: boolean;
}
export interface InputValidationOptionsStatic {
    new(options?: inputValidationOptions): InputValidationOptions;
}