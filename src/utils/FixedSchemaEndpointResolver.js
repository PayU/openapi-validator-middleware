const memoize = require('memoizee');
const { matchPath } = require('./internal/pathMatcher');

class FixedSchemaEndpointResolver {
    constructor(fixedRoute) {
        this.fixedRoute = fixedRoute;
        this.getMethodSchema = memoize((schemas, _route, method) => {
            return getMethodSchemaInternal(schemas, this.fixedRoute, method);
        }
        );
    }
}

function getMethodSchemaInternal(schemas, fixedRoute, method) {
    const methodLowerCase = method.toLowerCase();
    const routePath = matchPath(schemas, fixedRoute);
    const route = schemas[routePath];

    if (route && route[methodLowerCase]) {
        return route[methodLowerCase];
    }
}

module.exports = FixedSchemaEndpointResolver;
