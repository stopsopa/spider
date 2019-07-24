
const fetch = require('node-fetch');

// https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal
const AbortController = require('abort-controller');

const log = require('inspc');

module.exports = async (opt = {}) => {

    let {
        url,
        timeout = 3000,
    } = opt;

    if ( typeof timeout === 'string' ) {

        timeout = parseInt(timeout, 10);
    }

    if ( ! Number.isInteger(timeout) || timeout < 1 ) {

        timeout = 30000; // default 30 sec
    }

    if ( typeof url !== 'string' ) {

        throw new Error(`Url is not a string`);
    }

    if ( ! /^https?:\/\//.test(url) ) {

        throw new Error(`Url should start from http or https, it is: '${url}'`);
    }

    log.t(`attempt to fetch: '${url}'`);

    const controller = new AbortController();

    const handler = setTimeout(
        () => controller.abort(),
        timeout,
    );

    const json = {}

    const fres = await fetch(url, {
        signal: controller.signal,
    });

    json.status = fres.status;

    json.headers = (function () {
        try {

            const h = {}

            fres.headers.forEach((value, key) => h[key] = value);

            return h;
        }
        catch (e) {

            return {}
        }
    })();

    // content-type: "text/html; charset=utf-8"
    json.isHtml = (json.headers['content-type'] || '').indexOf('text/html') === 0;

    if (json.isHtml) {

        json.html = await fres.text();
    }

    clearTimeout(handler);

    return json;
}