# Master (Unreleased)

# 3.0.0 - ?? April, 2020

### New features

- Support for servers and base path in OAS 3 
- fastify: Fix support for requests with queryparams #117 
- fastify: Implement endopoint skiplist logic #117

### Improvements

- Speed-up import of `openapi-validator-middleware` and reduce total bundle size by removing polyfills

### Breaking changes

- Validate loaded OpenAPI specification (throws an error if it's not a valid OpenAPI 3.0 document) #47
- Drop Node 6 support #45
- If your OpenAPI 3.x specification includes servers definition, some of the endpoints that weren't being matched for validation in the past can start getting validated (if any of servers + path combination matches) #46