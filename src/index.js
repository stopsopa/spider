
const express           = require('express');

const Router            = express.Router;

const fetch             = require('node-fetch');

// https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal
const AbortController   = require('abort-controller');

const log               = require('inspc');

const { wait }          = require('nlab/delay');

const trim              = require('nlab/trim');

const fetchLib          = require('./fetchLib');
// const fetchLib          = require('./fetchLib-abandoned');

const isInTheSameOrigin = fetchLib.isInTheSameOrigin;

const knex              = require('knex-abstract');

const mrun              = knex().model.run;

const mnodes            = knex().model.nodes;

const mlogs             = knex().model.logs;

const medges            = knex().model.edges;

module.exports = (opt = {}) => {

    const {
        io,
    } = opt;

    io.on('connection', socket => {

        log('connected...');

        // * possible thanks to socketio-wildcard library
        socket.on('*', function(packet) {

            const {
                data = []
            } = packet;

            let [name, value] = data;

            if ( typeof name === 'string' && /^[ab]:/.test(name) ) {

                name = name.split(':');

                const mode = name.shift();

                name = name.join(':');

                if (mode === 'b') {

                    return socket.broadcast.emit(name, value);
                }

                if (mode === 'a') {

                    return io.emit(name, value);
                }
            }
        });

        // you can send something here to initialize data in browser
        socket.on('init', id => {

            log('init: ' + id)
        });

        socket.on('gethash', async () => {

            try {

                const hash = await mrun.generateNewHash();

                socket.emit('sethash', hash);
            }
            catch (e) {

                log.dump({
                    gethash_error: e
                }, 3)
            }
        });

        socket.on('start', async ({
            hash,
            url,
        }) => {

            try {

                let domain  = await mrun.getDomain(hash);

                let runid   = await mrun.findIdByHash(hash);

                if ( ! runid ) {

                    throw new Error(`Run entity not found by hash: '${hash}'`);
                }

                if ( ! domain && typeof url === 'string' ) {

                    domain = url;
                }

                domain = domain.replace(/^(https?:\/\/[^\/]+)\/.*$/i, '$1');

                domain = trim(domain, '/', 'r');

                const mainurl = url || domain;

                if ( ! /https?:\/\/[^\/]+/.test(domain) ) {

                    throw new Error(`Given domain '${domain}' is not valid...`);
                }

                let list = await mnodes.findUrlsToCheck(hash, domain);

                if (list.length === 0) {

                    await mnodes.ensureExist(mainurl);
                }

                list = await mnodes.findUrlsToCheck(hash, domain);

                do {

                    if (list.length) {

                        for (const url of list) {

                            const from = await mnodes.findIdByUrl(url);

                            try {

                                const data = await fetchLib({
                                    url,
                                });

                                const batch = [];

                                await mrun.transactify(async trx => {

                                    if ( Array.isArray(data.redirected) && data.redirected.length ) {

                                        let prev = from;

                                        let one;

                                        while (one = data.redirected.shift()) {

                                            const last          = data.redirected.length === 0;

                                            const sameOrigin    = isInTheSameOrigin(url, one[1]);

                                            const extra = {
                                                status: one[0],
                                            };

                                            if ( ! sameOrigin ) {

                                                extra.origin = domain;
                                            }

                                            if ( last ) {

                                                extra.json = data.json || null;
                                            }

                                            const to    = await mnodes.ensureExist(trx, one[1], extra);

                                            if (data.redirected.length !== 0) { // don't mark last one

                                                await mlogs.ensureExist(trx, runid, {
                                                    node    : to,
                                                });
                                            }

                                            if (prev !== to) {

                                                const eid   = await medges.ensureExist(trx, prev, to, one[0]);

                                                await mlogs.ensureExist(trx, runid, {
                                                    edge    : eid,
                                                });
                                            }

                                            prev = to;
                                        }
                                    }
                                    else {

                                        await mnodes.update(trx, {
                                            status  : data.status,
                                            json    : data || null,
                                        }, from);

                                        batch.push({
                                            target: 'n',
                                            data: {
                                                id: from,
                                            }
                                        });

                                        if ( isInTheSameOrigin(url, domain) ) {

                                            for (let link of data.foundlinks) {

                                                if ( ! /https?:\/\//g.test(link) ) {

                                                    link = domain + link;
                                                }

                                                const extra = {};

                                                if ( ! isInTheSameOrigin(url, link) ) {

                                                    extra.origin = domain;
                                                }

                                                const nid   = await mnodes.ensureExist(trx, link, extra);

                                                batch.push({
                                                    target: 'n',
                                                    data: {
                                                        id: nid,
                                                    }
                                                });

                                                const eid   = await medges.ensureExist(trx, from, nid);

                                                batch.push({
                                                    target: 'e',
                                                    data: {
                                                        id: eid,
                                                        from,
                                                        to: nid
                                                    }
                                                });

                                                await mlogs.ensureExist(trx, runid, {
                                                    edge    : eid,
                                                });
                                            }
                                        }
                                    }

                                    await mlogs.ensureExist(trx, runid, {
                                        node : from,
                                    });
                                });

                                socket.emit('batch', batch);
                            }
                            catch (e) {

                                log.dump({
                                    url,
                                    parsing_error: e
                                }, 3);

                                await mnodes.update({
                                    status  : 0,
                                    json    : String(e),
                                }, from);

                                await mlogs.ensureExist(runid, {
                                    node    : from,
                                });

                                // await mlogs.
                            }
                        }

                        list = await mnodes.findUrlsToCheck(hash, domain);
                    }

                } while (list.length);
            }
            catch (e) {

                log.dump({
                    start_error: e
                }, 3)
            }
        });

        socket.on('load', async ({
            input,
            hash,
            offset,
        }) => {

            try {

                let where = '';

                const params = {};

                // if (hash) {
                //
                //     where = ' r.hash = :hash ';
                //
                //     params.hash = hash;
                // }

                if (input) {

                    if (where) {

                        where += ' AND ';
                    }

                    where += ' n.url LIKE :url ';

                    params.url = input;
                }

                if (where) {

                    where = ' WHERE ' + where;
                }

                let query = `
SELECT                r.hash
FROM                  nodes n
           INNER JOIN logs l
                   ON n.id = l.node
           INNER JOIN :table: r
                   ON r.id = l.run
                      ${where}
GROUP BY              r.hash
ORDER BY              r.created DESC                 
                `;

                const hashes = await mrun.query(true, query, params);
            }
            catch (e) {

                log.dump({
                    load_error: e
                }, 3)
            }
        });

        // const handler = setInterval(() => {
        //
        //     socket.broadcast.emit('recuring', (new Date()).toISOString().substring(0, 19).replace('T', ' '));
        //
        // }, 3000);
        //
        // socket.on('disconnect', () => {
        //     clearInterval(handler);
        // })
    })

    // setInterval(() => {
    //
    //     io.emit('recuring', (new Date()).toISOString().substring(0, 19).replace('T', ' '));
    //
    // }, 1000)


    const router = Router();

    /**
     * @todo
     * - redirects
     */

    /**
     *  fetch('/router?url=' + encodeURIComponent('http://localhost:4455/router-test?status=504&ms=2000'))
     *      .then(res => res.json())
     *      .then(json => console.log(JSON.stringify(json, null, 4)))
     *  ;
     *
     *
     fetch('/router?url=' + encodeURIComponent('http://localhost:4455/index.html'))
         .then(res => res.json())
         .then(json => console.log(JSON.stringify(json, null, 4)))
         // .then(json => console.log(json.html))
     ;

     timeout test:

     fetch('/router?timeout=2000&url=' + encodeURIComponent('http://localhost:4455/router-test?status=504&ms=6000'))
         .then(res => res.json())
         .then(json => console.log(JSON.stringify(json, null, 4)))
     ;


     // redirection test
     fetch('/router?url=' + encodeURIComponent('http://localhost:4455/red2'))
         .then(res => res.json())
         .then(json => console.log(JSON.stringify(json, null, 4)))
         // .then(json => console.log(json.html))
     ;
     */
    router.all('/router', async (req, res) => {

        try {

            const result = await fetchLib({
                url     : req.body.url      || req.query.url,
                timeout : req.body.timeout  || req.query.timeout,
            });

            return res.json(result);
        }
        catch (e) {

            res.statusCode = 500;

            log.dump({
                '/router error: ': e,
            }, 3)

            return res.json({
                error: String(e)
            });
        }
    });

    /**
     * fetch('http://localhost:4455/router-test?s=501');
     * fetch('http://localhost:4455/router-test?s=501&ms=2000');
     *
     * fetch('http://localhost:4455/router-test?s=501&ms=2000')
     *      .then(res => res.json())
     *      .then(json => console.log(JSON.stringify(json, null, 4)))
     * ;
     *
     *
         fetch('http://localhost:4455/router-test?s=501&h=X-one:val1&h=Content-type:text/html; charset=utf-8')
         .then(res => res.json())
         .then(json => console.log(JSON.stringify(json, null, 4)))
         ;


         fetch('http://localhost:4455/router-test?h=Content-type:text/html; charset=utf-8&c=<!doctype html><html lang="en"><body><b>test...</b></body></html>')
         .then(res => res.text())
         .then(text => console.log(text))
         ;

         s      - status
         h      - header - can be used multiple times in get or given as an array in post/json
         c      - raw content (e.g. raw html to return)
         ms     - delay in miliseconds
     */
    router.all('/router-test', async (req, res) => {

        const json = {
            query   : req.query,
            body    : req.body,
        };

        let s = req.body.s || req.query.s;

        if ( typeof s === 'string' && trim(s) ) {

            s = parseInt(s, 10);
        }

        if ( Number.isInteger(s) && s > 0 ) {

            res.statusCode = json.status = s;
        }

        let ms = req.body.ms || req.query.ms;

        if ( typeof ms === 'string' && trim(ms) ) {

            ms = parseInt(ms, 10);
        }

        if ( Number.isInteger(ms) && ms > 0 ) {

            await wait(json.ms = ms);
        }

        let h = req.body.h || req.query.h;

        if ( typeof h !== 'undefined' ) {

            if ( typeof h === 'string' ) {

                h = [h];
            }

            if (Array.isArray(h)) {

                h.forEach(h => {

                    h = h.split(':');

                    if (h.length > 1) {

                        res.set(h.shift(), h.join(':'))
                    }
                });
            }
        }

        let c = req.body.c || req.query.c;

        if ( typeof c === 'string' ) {

            return res.send(c);
        }

        return res.json(json);
    });

    /**
     * fetch('/any/thing?redirect=' + encodeURIComponent('/red1'))
     */
    router.use((req, res, next) => {

        let redirect = req.query.redirect;

        if ( typeof redirect === 'string' ) {

            log.dump({
                redirect,
                protocol        : req.protocol,
                host            : req.get('host'),
                reconstrucred   : req.protocol + '://' + req.get('host') + redirect,
            }, 4)

            if ( ! /^https?:\/\//i.test(redirect) ) {

                redirect = req.protocol + '://' + req.get('host') + redirect;
            }

            return res.redirect(redirect);
        }

        next();
    });

    router.all('/red1', (req, res) => {

        res.redirect(`/public/dir/redirect.html`);
    });

    router.all('/red2', (req, res) => {

        res.redirect(301, `/red1`);
    });

    router.all('/red3', (req, res) => {

        const n = (function () {
            try {
                return parseInt((req.query.n || 1), 10) - 1;
            }
            catch (e) {
                return 0;
            }
        }());

        const end = (function () {
            try {
                return req.query.end || false;
            }
            catch (e) {
                return 0;
            }
        }());

        if (n) {

            let red = `/red3?n=${n}`;

            if ( typeof end === 'string' ) {

                red += `&end=${end}`;
            }

            return res.redirect(red);
        }

        if ( typeof end === 'string' ) {

            return res.redirect(end);
        }

        res.redirect(`/public/dir/redirect.html`);
    });

    return router;
};


