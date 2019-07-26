
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const a                 = prototype.a;

const isObject          = require('nlab/isObject');

const sha1              = require('sha1');

const trim              = require('nlab/trim')

const unique            = require('nlab/unique')

const table             = 'run';

const id                = 'id';

module.exports = knex => extend(knex, prototype, {
    findIdByHash: function (...args) {

        let [debug, trx, hash] = a(args);

        return this.queryColumn(debug, trx, `select id from :table: where hash = :hash`, {
            hash,
        });
    },
    generateNewHash: async function (create = true) {

        let hash, count;

        do {

            hash = sha1(unique() + (new Date()).toISOString().substring(0, 19).replace('T', ' '));

            count = await this.queryColumn(`select count(*) c from :table: where hash = :hash`, {
                hash,
            });

        } while (count > 0);

        if (create) {

            await this.insert({
                hash,
            });
        }

        return hash;
    },
    getDomain: async function (hash) {

        if ( typeof hash !== 'string' ) {

            throw new Error(`getDomain: hash !== string`);
        }

        if ( ! trim(hash) ) {

            throw new Error(`getDomain: hash is an empty string`);
        }

        const url = await this.queryColumn(`
SELECT                  n.url
FROM                    run r
             INNER JOIN logs l
                     ON r.id = l.run
             INNER JOIN nodes n
                     ON n.id = l.node
WHERE                   r.hash = :hash
LIMIT                   1        
        `, {
            hash
        });

        if (url) {

            return url.replace(/^(https?:\/\/[^\/]+)\/.*$/i, '$1');
        }
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