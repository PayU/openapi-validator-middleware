function _getParameters(ctx) {
    let requestOptions = {};
    let path = ctx._matchedRoute;
    requestOptions.path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
    requestOptions.headers = ctx.request.req.headers;
    requestOptions.params = ctx.params;
    requestOptions.query = ctx.query;
    requestOptions.files = ctx.req.files;
    requestOptions.method = ctx.req.method;
    requestOptions.body = ctx.req.body || ctx.request.body;

    return requestOptions;
}

async function validate(_schema, _pathObjects, validateRequest, ctx, next) {
    let requestOptions, errors;
    requestOptions = _getParameters(ctx, next);
    errors = await validateRequest(requestOptions);
    if (errors) {
        throw errors;
    }
    await next();
}

module.exports = {
    validate: validate
};
