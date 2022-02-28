const memoize = require('nano-memoize');

// This logic is wrapped into class to have isolated memoization contexts
class SchemaEndpointResolver {
    constructor() {
        this.getMethodSchema = memoize(getMethodSchemaInternal, { maxAge: -1 });
    }
}

function getMethodSchemaInternal(schemas, path, method) {
    const methodLowerCase = method.toLowerCase();
    const routePath = pathMatcher(schemas, path);
    const route = schemas[routePath];

    if (route && route[methodLowerCase]) {
        return route[methodLowerCase];
    }
}

function _pathMatcherInternal(routes, path, exactMatch) {
    return Object
        .keys(routes)
        .find((route) => {
            const routeArr = route.split('/');
            const pathArr = path.split('/');

            if (routeArr.length !== pathArr.length) return false;

            return routeArr.every((seg, idx) => {
                if (seg === pathArr[idx]) return true;

                if (!exactMatch) {
                    // if current path segment is param
                    if (seg.startsWith(':') && (idx in pathArr)) return true;
                }

                return false;
            });
        });
}

function pathMatcher(routes, path) {
    return _pathMatcherInternal(routes, path, true) || _pathMatcherInternal(routes, path, false);
}

module.exports = SchemaEndpointResolver;
