
const https         = require('https');

const http          = require('http');

const path          = require('path');

const querystring   = require('querystring');

const URL           = require('url').URL;

// https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal
// const AbortController = require('abort-controller');

const log       = require('inspc');

const trim      = require('nlab/trim');

const { wait } = require('nlab/delay');

var reg = /<a\s+[^>]*?href\s*=\s*(['"])([^\1]*?)\1[^>]*?>/gi;

function request (url, timeout = 30000, internal) {

    return new Promise((resolve, reject) => {

        internal || log.t(`attempt to fetch: '${url}'`);

        const uri   = new URL(url);

        const lib   = (uri.protocol === 'https:') ? https : http;

        const get = {};

        const query = querystring.stringify(get)

        // log.dump({
        //     url,
        //     hostname    : uri.hostname,
        //     port        : uri.port || '80',
        //     path        : uri.pathname + uri.search + (query ? (uri.search.includes('?') ? '&' : '?') + query : ''),
        //     // method      : 'POST',
        //     headers     : {
        //         // 'Content-Type': 'application/json; charset=utf-8',
        //         Accept: `text/html; charset=utf-8`,
        //     },
        // })

        const rq = {
            hostname    : uri.hostname,
            port        : uri.port || ( (uri.protocol === 'https:') ? '443' : '80'),
            path        : uri.pathname + uri.search + (query ? (uri.search.includes('?') ? '&' : '?') + query : ''),
            // method      : 'POST',
            headers     : {
                // 'Content-Type': 'application/json; charset=utf-8',
                Accept: `text/html; charset=utf-8`,
            },
        };

        var req = lib.request(rq, res => {

            const isHtml = (res.headers['content-type'] || '').toLowerCase().indexOf('text/html') === 0;

            if (isHtml) {

                res.setEncoding('utf8');

                let body = '';

                res.on('data', chunk => {

                    body += chunk
                });

                res.on('end', () => {

                    // log.dump({
                    //     status: res.statusCode,
                    //     headers: res.headers,
                    //     isHtml,
                    //     uri,
                    //     body,
                    //     rq,
                    // }, 5)

                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body,
                        isHtml,
                        uri,
                    })
                });
            }
            else {

                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    isHtml,
                    uri,
                })
            }
        });

        req.on('socket', function (socket) { // uncomment this to have timeout

            socket.setTimeout(timeout);

            socket.on('timeout', () => { // https://stackoverflow.com/a/9910413/5560682

                req.abort();

                reject({
                    type: 'timeout',
                })
            });
        });

        req.on('error', e => reject({
            type: 'error',
            error: e,
        }));

        // req.write(JSON.stringify({
        //     data: 'sent'
        // }, null, 4));

        req.end();
    });
}


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

    var pathname = location.pathname.split('/');
    pathname.pop();
    pathname = pathname.join('/');

    var noorigin = location.href.substring(location.origin.length)
    var nooriginwithouthash = noorigin;

    if (noorigin.indexOf('#') > -1) {
        nooriginwithouthash = noorigin.split('#');
        nooriginwithouthash = nooriginwithouthash[0];
    }

    // remove comments
    html = html.replace(/<!--.*?-->/sg, '');

    let list = [];

    reg.lastIndex = 0;

    let tmp;

    do {

        tmp = reg.exec(html);

        if (tmp) {

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
            links.push(path.normalize(location.pathname + h));
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

                                links.push(location.protocol + '/' + path.normalize(h));

                continue;
            }
            links.push(h);
            continue;
        }

        if (h.indexOf(location.origin) === 0) {
            links.push(h.substring(location.origin.length));
            continue;
        }

        // if ( ! /^https?:\/\//i.test(h) && h[0] !== '/' ) {
        //     links.push(pathname + '/' + h);
        // }

        if ( /^https?:\/\//i.test(h) ) {

            links.push(h);
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
        timeout         = 30000,
        html            = false,
        redirections    = 8,
        redcache        = [],
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

    const json = {
        foundlinks: [],
    }

    const data      = await request(url, timeout, redcache.length > 0);

    const status    = data.status;

    json.status     = status;

    json.headers    = data.headers;

    json.isHtml     = data.isHtml;

    if (status === 301 || status === 302) {

        let redloc = json.headers.location + '';

        if ( typeof redloc !== 'string' ) {

            throw Err(`redloc is not defined`);
        }

        if ( ! /^https?:\/\//i.test(redloc) ) {

            const t = data.uri;

            redloc = t.protocol + '//' + t.host + redloc;
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

        return await fetchLib(opt);
    }

    const htmltmp = data.body;

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

    return json;
}

fetchLib.isInTheSameOrigin = isInTheSameOrigin;

module.exports = fetchLib;