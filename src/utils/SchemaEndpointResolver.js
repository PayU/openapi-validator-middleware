const memoize = require('memoizee');
const { matchPath } = require('./internal/pathMatcher');

// This logic is wrapped into class to have isolated memoization contexts
class SchemaEndpointResolver {
    constructor() {
        this.getMethodSchema = memoize(getMethodSchemaInternal);
    }
}

function getMethodSchemaInternal(schemas, path, method) {
    const methodLowerCase = method.toLowerCase();
    const routePath = matchPath(schemas, path);
    const route = schemas[routePath];

    if (route && route[methodLowerCase]) {
        return route[methodLowerCase];
    }
}

module.exports = SchemaEndpointResolver;
