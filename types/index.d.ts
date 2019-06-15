// TypeScript Version: 3.2

/**
 * Initialize the input validation middleware by
 * providing it with the swagger file path and
 * configuration options. This function should be called
 * before using `validate` middleware.
 */
export function init(swaggerPath: string, options?: ajvValidatorOptions): Promise<void>;

/**
 * Middleware that validates the request against the swagger
 * file, according to the request method and route
 */
export function validate(req: object, res: object, next: Function): void;

export class InputValidationError extends Error {
    errors: Array<string>;

    constructor(errors: Array<string>, path?: string, method?: string, options?: inputValidationOptions)
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

export interface inputValidationOptions {
    beautifyErrors?: boolean;
    firstError?: boolean;
}
