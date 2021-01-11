# Master


# 3.2.1 - 9 December, 2020
### Fixes
- Add getNewMiddleware to index.d.ts #149

# 3.2.0 - 26 November, 2020
### Improvements
- Update dependencies to address security vulnerabilities

### Features
- Add getNewMiddleware which allow crating multiple-instances of the middleware #145

# 3.1.1 - 2 September, 2020

### Fixes
- Add errorFormatter to ajvValidatorOptions types #137

# 3.1.0 - 18 August, 2020

### Features
- Support of external refs (async init only) #134


# 3.0.1 - 7 July, 2020

### Improvements
- Speed-up `openapi-validator-middleware` import by lazy loading required dependencies #129


# 3.0.0 - 1 May, 2020

### New features

- Support for servers and base path in OAS 3 
- fastify: Fix support for requests with queryparams #117 
- fastify: Implement endpoint skiplist logic #117

### Improvements

- Speed-up import of `openapi-validator-middleware` and reduce total bundle size by removing polyfills

### Breaking changes

- Validate loaded OpenAPI specification (throws an error if it's not a valid OpenAPI 3.0 document)
- Drop Node 6 support
- If your OpenAPI 3.x specification includes servers definition, some of the endpoints that weren't being matched for validation in the past can start getting validated (if any of servers + path combination matches) #46
