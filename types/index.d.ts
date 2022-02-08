// TypeScript Version: 3.2

/**
 * Initialize the input validation middleware by
 * providing it with the swagger file path and
 * configuration options. This function should be called
 * before using `validate` middleware.
 */
declare function init(schemaPath: string, options?: ajvValidatorOptions): void;
declare function init(jsonSchema: Record<string, any>, options?: ajvValidatorOptions): void;
export { init };
export { initAsync };
export { validate };
export { getNewMiddleware };

/**
 * Initialize the input validation middleware by
 * providing it with the swagger file path and
 * configuration options. This function should be called
 * and awaited before using `validate` middleware.
 * This init variant support loading of external references.
 */
declare function initAsync(schemaPath: string, options?: ajvValidatorOptions): Promise<void>;
declare function initAsync(jsonSchema: Record<string, any>, options?: ajvValidatorOptions): Promise<void>;

/**
 * Middleware that validates the request against the swagger
 * file, according to the request method and route
 */
declare function validate(ctx: Record<string, any>, next: Function): void; // koa
declare function validate(req: Record<string, any>, res: Record<string, any>, next: Function): void; // express
declare function validate(options: FastifyPluginOptions): any; // fastify

export class InputValidationError extends Error {
    errors: Array<ErrorDetails | string>;

    constructor(errors: Array<ErrorDetails | string>, options?: inputValidationOptions)
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
    ajvConfigBody?: Record<string, any>;
    ajvConfigParams?: Record<string, any>;
    beautifyErrors?: boolean;
    contentTypeValidation?: boolean;
    errorFormatter?: (errors: Array<ErrorDetails>, options: ajvValidatorOptions) => Error;
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

declare class MiddlewareClass {
    InputValidationError: InputValidationError;

    init(schemaPath: string, options?: ajvValidatorOptions): void;
    // eslint-disable-next-line no-dupe-class-members
    init(jsonSchema: Record<string, any>, options?: ajvValidatorOptions): void;
    initAsync(schemaPath: string, options?: ajvValidatorOptions): Promise<void>;
    // eslint-disable-next-line no-dupe-class-members
    initAsync(jsonSchema: Record<string, any>, options?: ajvValidatorOptions): Promise<void>;

    validate(ctx: Record<string, any>, next: Function): void; // koa
    // eslint-disable-next-line no-dupe-class-members
    validate(req: Record<string, any>, res: Record<string, any>, next: Function): void; // express
    // eslint-disable-next-line no-dupe-class-members
    validate(options: FastifyPluginOptions): any; // fastify
}

declare function getNewMiddleware(schemaPath: string, options?: ajvValidatorOptions): MiddlewareClass;
