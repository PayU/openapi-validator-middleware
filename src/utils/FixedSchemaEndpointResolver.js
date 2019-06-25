const memoize = require('memoizee');

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
    const routePath = pathMatcher(schemas, fixedRoute);
    const route = schemas[routePath];

    if (route && route[methodLowerCase] && route[methodLowerCase]) {
        return route[methodLowerCase];
    }
}

function pathMatcher(routes, path) {
    return Object
        .keys(routes)
        .find((route) => {
            const routeArr = route.split('/');
            const pathArr = path.split('/');

            if (routeArr.length !== pathArr.length) return false;

            return routeArr.every((seg, idx) => {
                if (seg === pathArr[idx]) return true;

                // if current path segment is param
                if (seg.startsWith(':') && pathArr[idx]) return true;

                return false;
            });
        });
}

module.exports = FixedSchemaEndpointResolver;
