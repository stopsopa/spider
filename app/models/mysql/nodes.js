
const abstract          = require('knex-abstract');

const extend            = abstract.extend;

const prototype         = abstract.prototype;

const log               = require('inspc');

const sha1              = require('sha1');

const a                 = prototype.a;

const isObject          = require('nlab/isObject');

const trim              = require('nlab/trim');

const table             = 'nodes';

const id                = 'id';

module.exports = knex => extend(knex, prototype, {
    findIdByUrl: function (...args) {

        let [debug, trx, url] = a(args);

        return this.queryColumn(debug, trx, `select id from :table: where url = :url`, {
            url,
        });
    },
    ensureExist: async function (...args) {

        let [debug, trx, url, extra = {}] = a(args);

        const id = await this.queryColumn(debug, trx, `select id from :table: where url = :url`, {
            url,
        });

        if ( id ) {

            if ( Object.keys(extra).length ) {

                await this.update(debug, trx, extra, id);
            }
            else {

                await this.update(debug, trx, {
                    status  : null,
                    json    : null,
                }, id);
            }

            return id;
        }

        return await this.insert(debug, trx, {
            ...extra,
            url,
        });
    },
    findUrlsToCheck: async function (...args) {

        let [debug, trx, hash, domain] = a(args);

        const list = await this.query(debug, trx, `
SELECT        n.url
FROM          nodes n 
WHERE         (
    n.url LIKE :prefix
    or 
    n.origin = :origin
)
          AND n.url NOT IN (
                SELECT              n.url
                FROM                nodes n 
                         INNER JOIN logs l
                                 ON n.id = l.node
                         INNER JOIN run r
                                 ON r.id = l.run
                WHERE               (
                                        n.url LIKE :prefix
                                     or n.origin = :origin
                                    )
                                AND r.hash = :hash
)
`, {
            prefix: domain + '%',
            origin: domain,
            hash,
        });

        return list.map(row => row.url);
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

        if ( typeof row.url === 'string' && trim(row.url) ) {

            row.hash = sha1(row.url);
        }

        if ( typeof row.json !== 'undefined' && typeof row.json !== 'string' && row.json !== null ) {

            row.json = JSON.stringify(row.json, null, 4);
        }

        return row;
    },
}, table, id);