
const fetch = require('node-fetch');

// https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal
const AbortController = require('abort-controller');

const log       = require('inspc');

const trim      = require('nlab/trim');

const { wait } = require('nlab/delay');

var reg = /<a\s+[^>]*?href\s*=\s*(['"])([^\1]*?)\1[^>]*?>/gi;

const URL           = require('url').URL;

function isInTheSameOrigin(url1, url2) {

    try {

        url1   = new URL(url1);

        url2   = new URL(url2);

        return url1.protocol === url2.protocol
            && url1.username === url2.username
            && url1.password === url2.password
            && url1.host === url2.host
        ;
    }
    catch (e) {

        return false;
    }
}

function Err(e) {
    return new Error(`fetchLib error: ` + String(e));
}

/**
 *
 fetch('/router?url=' + encodeURIComponent('http://hub.ph*****abs.com/'))
     .then(res => res.json())
     .then(json => console.log(JSON.stringify(json, null, 4)))
 ;
 */
function extractLinks(originalurl, html) {

    const location   = new URL(originalurl);

    var h, links = [];

    var path = location.pathname.split('/');
    path.pop();
    path = path.join('/');

    var noorigin = location.href.substring(location.origin.length)
    var nooriginwithouthash = noorigin;

    if (noorigin.indexOf('#') > -1) {
        nooriginwithouthash = noorigin.split('#');
        nooriginwithouthash = nooriginwithouthash[0];
    }

    let list = [];

    reg.lastIndex = 0;

    let reset = 10;

    let tmp;

    do {

        tmp = reg.exec(html);

        if (tmp) {

            if (reset) {

                reset -= 1;

                reg.lastIndex = 0;
            }

            list.push(tmp[2]);
        }

    } while (tmp);

    list = list.map(u => trim(u)).filter(Boolean);

    // http://origin/directory/link
    // /directory/link
    // directory/link
    // not //origin/directory/link
    // not #hash
    for (var i = 0, l = list.length ; i < l ; i += 1 ) {

        h = list[i];

        if (h === location.href || h === noorigin || h === nooriginwithouthash) {
            continue;
        }

        if (h[0] === '?') {
            links.push(location.pathname + h);
            continue;
        }

        if (/^file:/.test(h)) {
            continue;
        }

        if (/^mailto:/.test(h)) {
            continue;
        }

        if (/^javascript:/.test(h)) {
            continue;
        }

        if (h[0] === '#') {
            continue;
        }

        if (h[0] === '/') {
            if (h[1] && h[1] === '/') {
                continue;
            }
            links.push(h);
            continue;
        }

        if (h.indexOf(location.origin) === 0) {
            links.push(h.substring(location.origin.length));
            continue;
        }

        if ( ! /^https?:\/\//i.test(h) && h[0] !== '/' ) {
            links.push(path + '/' + h);
        }
    }

    // unique
    links = links.reduce((acc, link) => {

        acc[link] = link;

        return acc;
    }, {});

    links = Object.values(links);

    return links;
}

const fetchLib = async (opt = {}) => {

    let {
        url,
        timeout         = 3000,
        html            = false,
        redirections    = 8,
    } = opt;

    if ( typeof timeout === 'string' ) {

        timeout = parseInt(timeout, 10);
    }

    if ( ! Number.isInteger(timeout) || timeout < 1 ) {

        timeout = 30000; // default 30 sec
    }

    if ( typeof url !== 'string' ) {

        throw Err(`Url '${url}' is not a string`);
    }

    if ( ! /^https?:\/\//.test(url) ) {

        throw Err(`Url should start from http or https, it is: '${url}'`);
    }

    const controller = new AbortController();

    const handler = setTimeout(
        () => controller.abort(),
        timeout,
    );

    const json = {
        foundlinks: [],
    }

    let fres;

    try {

        log.t(`attempt to fetch: '${url}'`);

        fres = await fetch(url, {
            signal      : controller.signal,
            redirect    : 'manual',
            headers: {
                Accept: `text/html`
            }
        });
    }
    catch (e) {

        clearTimeout(handler);

        throw e;
    }

    const status = fres.status;

    json.status = status;

    json.headers = (function () {
        try {

            const h = {}

            fres.headers.forEach((value, key) => h[key + ''] = value + '');

            return h;
        }
        catch (e) {

            return {}
        }
    })();

    if (status === 301 || status === 302) {

        const redloc = json.headers.location + '';

        if ( typeof redloc !== 'string' ) {

            throw Err(`redloc is not defined`);
        }

        // if ( ! isInTheSameOrigin(redloc, url) ) {
        //
        //     throw Err(`Redirected url is not in the same domain: '${redloc}'`);
        // }

        if ( redirections === 0 ) {

            throw Err(`Too many redirections`);
        }

        opt.redirections = redirections - 1;

        if ( ! Array.isArray(opt.redcache) ) {

            opt.redcache = [];
        }

        opt.redcache.push([status, url]);

        opt.url = redloc;

        clearTimeout(handler);

        return await fetchLib(opt);
    }

    // content-type: "text/html; charset=utf-8"
    json.isHtml = (json.headers['content-type'] || '').toLowerCase().indexOf('text/html') === 0;

    const htmltmp = await fres.text();

    if (htmltmp) {

        if (html && json.isHtml) {

            json.html = htmltmp;
        }

        json.foundlinks = extractLinks(url, htmltmp);
    }

    if ( Array.isArray(opt.redcache) ) {

        json.redirected = opt.redcache;

        json.redirected.push([status, url]);
    }

    clearTimeout(handler);

    return json;
}

fetchLib.isInTheSameOrigin = isInTheSameOrigin;

module.exports = fetchLib;