// TypeScript Version: 3.2

/**
 * Initialize the input validation middleware by
 * providing it with the swagger file path and
 * configuration options. This function should be called
 * before using `validate` middleware.
 */
declare function init(schemaPath: string, options?: ajvValidatorOptions): void;
declare function init(jsonSchema: Object, options?: ajvValidatorOptions): void;
export { init };

/**
 * Initialize the input validation middleware by
 * providing it with the swagger file path and
 * configuration options. This function should be called
 * and awaited before using `validate` middleware.
 * This init variant support loading of external references.
 */
declare function initAsync(schemaPath: string, options?: ajvValidatorOptions): Promise<void>;
declare function initAsync(jsonSchema: Object, options?: ajvValidatorOptions): Promise<void>;
export { initAsync };

/**
 * Middleware that validates the request against the swagger
 * file, according to the request method and route
 */
declare function validate(ctx: Object, next: Function): void; // koa
declare function validate(req: Object, res: Object, next: Function): void; // express
declare function validate(options: FastifyPluginOptions): any; // fastify
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

export type frameworks = 'koa' | 'express' | 'fastify';

export interface format {
    name: string;
    pattern: RegExp | string;
}

export interface FastifyPluginOptions {
    skiplist?: Array<string>;
}

export interface ajvValidatorOptions {
    ajvConfigBody?: object;
    ajvConfigParams?: object;
    beautifyErrors?: boolean;
    contentTypeValidation?: boolean;
    errorFormatter?: (errors: ErrorDetails, options: ajvValidatorOptions) => Error;
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
