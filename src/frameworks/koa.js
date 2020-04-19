function getValidator(validateRequest) {
    return async function validate(ctx, next) {
        const requestOptions = _getParameters(ctx);
        const errors = validateRequest(requestOptions);
        if (errors) {
            throw errors;
        }
        await next();
    };

    function _getParameters(ctx) {
        const requestOptions = {};
        const path = ctx._matchedRoute;
        requestOptions.path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
        requestOptions.headers = ctx.request.req.headers;
        requestOptions.params = ctx.params;
        requestOptions.query = ctx.query;
        requestOptions.files = ctx.req.files;
        requestOptions.method = ctx.req.method;
        requestOptions.body = ctx.req.body || ctx.request.body;

        return requestOptions;
    }
}

module.exports = { getValidator };
