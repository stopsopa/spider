
const fetch = require('node-fetch');

const log = require('inspc');

const { wait } = require('nlab/delay');

const trim = require('nlab/trim');

// https://github.com/bitinn/node-fetch#request-cancellation-with-abortsignal
const AbortControllerManualTest = require('abort-controller');

const controller = new AbortControllerManualTest();

const timeout = setTimeout(
    () => { controller.abort(); },
    2000,
);

(async function () {

    try {

        const res = await fetch(
            'http://localhost:4455/router-test?ms=6000&h=Content-type:text/html; charset=utf-8&c=<!doctype html><html lang="en"><body><b>test...</b></body></html>',
            {
                signal: controller.signal
            }
        );

        const text = await res.text();

        log.dump({
            text,
        })
    }
    catch (e) {

        log.dump({
            abort_handled: String(e)
        })
    }

}());