
const common                    = require('./common');

const nodes                     = require('./nodes');

const edges                     = require('./edges');

const logs                      = require('./logs');

const run                       = require('./run');

// images.loadPaths();

const managers = {
    common,
    nodes,
    edges,
    logs,
    run,
};

/**
 * http://2ality.com/2014/12/es6-proxies.html
 */
module.exports = new Proxy(managers, {
    get(target, propKey, receiver) {

        if (typeof target[propKey] !== 'undefined') {

            return target[propKey];
        }

        const keys = Object.keys(target);

        throw `No such mysql manager '${propKey}', registered managers are: ` + keys.join(', ');
    },
});

