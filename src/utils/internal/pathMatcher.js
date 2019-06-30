function matchPath(routes, path) {
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

module.exports = {
    matchPath
};
