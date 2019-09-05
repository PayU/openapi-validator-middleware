// TypeScript Version: 3.2

/**
 * Initialize the input validation middleware by
 * providing it with the swagger file path and
 * configuration options. This function should be called
 * before using `validate` middleware.
 */
export function init(swaggerPath: string, options?: ajvValidatorOptions): void;

/**
 * Middleware that validates the request against the swagger
 * file, according to the request method and route
 */
declare function validate(ctx: any, next: Function): void; // koa
declare function validate(req: any, res: any, next: Function): void; // express
export { validate };

export class InputValidationError extends Error {
    errors: Array<ErrorDetails | string>;

    constructor(errors: Array<ErrorDetails>, options?: inputValidationOptions)
}

export interface ErrorDetails {
    dataPath: string;
    keyword: string;
    message: string;
    params: Record<string, any>;
    schemaPath: string;
}

export enum frameworks {
    koa,
    express
}

export interface format {
    name: string;
    pattern: RegExp | string;
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

export interface inputValidationOptions {
    beautifyErrors?: boolean;
    firstError?: boolean;
}
