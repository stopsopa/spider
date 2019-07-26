
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const a                 = prototype.a;

const isObject          = require('nlab/isObject');

const table             = 'logs';

const id                = 'id';

module.exports = knex => extend(knex, prototype, {
    ensureExist: async function (...args) {

        let [debug, trx, run, row = {}] = a(args);

        if ( ! Number.isInteger(row.node) && ! Number.isInteger(row.edge) ) {

            throw new Error(`logs manager ensureExist error: It is necessary to set node or edge`);
        }

        if ( Number.isInteger(row.node) && row.node < 1 ) {

            throw new Error(`logs manager ensureExist error: node < 1`);
        }

        if ( Number.isInteger(row.edge) && row.edge < 1 ) {

            throw new Error(`logs manager ensureExist error: edge < 1`);
        }

        row.run = run;

        let query = `select id from :table: where `;

        if (row.node) {

            query += `node = :node`;
        }
        else {

            query += `edge = :edge`;
        }

        const id = await this.queryColumn(debug, trx, query, {...row});

        if ( id ) {

            return id;
        }

        return await this.insert(debug, trx, {...row});
    },
    fromDb: async function (row, opt, trx) {

        if ( ! isObject(row) ) {

            return row;
        }

        return row;
    },
    toDb: async function (row, opt, trx) {

        if ( ! isObject(row) ) {

            return row;
        }

        if ( ! Number.isInteger(row.node) && ! Number.isInteger(row.edge) ) {

            throw new Error(`logs manager insert error: It is necessary to set node or edge`);
        }

        if ( Number.isInteger(row.node) && row.node < 1 ) {

            throw new Error(`logs manager insert error: node < 1`);
        }

        if ( Number.isInteger(row.edge) && row.edge < 1 ) {

            throw new Error(`logs manager insert error: edge < 1`);
        }

        return row;
    },
}, table, id);