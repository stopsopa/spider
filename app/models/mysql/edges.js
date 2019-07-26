
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const a                 = prototype.a;

const isObject          = require('nlab/isObject');

const table             = 'edges';

const id                = 'id';

module.exports = knex => extend(knex, prototype, {
    ensureExist: async function (...args) {

        let [debug, trx, from, to, redirection = null] = a(args);

        const id = await this.queryColumn(debug, trx, `select id from :table: where from_id = :from and to_id = :to`, {
            from,
            to,
        });

        if ( id ) {

            await this.update(debug, trx, {
                redirection: null,
            }, id);

            return id;
        }

        return await this.insert(debug, trx, {
            from_id : from,
            to_id   : to,
        });
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

        return row;
    },
}, table, id);