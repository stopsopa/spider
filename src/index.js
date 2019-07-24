
const express = require('express');

const Router = express.Router;

const fetch = require('node-fetch');

// https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal
const AbortController = require('abort-controller');

const log = require('inspc');

const { wait } = require('nlab/delay');

const trim = require('nlab/trim');

const fetchLib = require('./fetchLib');

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

    setInterval(() => {

        io.emit('recuring', (new Date()).toISOString().substring(0, 19).replace('T', ' '));

    }, 1000)


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
     */
    router.all('/router', async (req, res) => {

        try {

            return res.json(await fetchLib({
                url     : req.body.url || req.query.url,
                timeout : req.body.timeout || req.query.timeout,
            }))
        }
        catch (e) {

            res.statusCode = 500;

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

    return router;
};


