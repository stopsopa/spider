/**
 * node get.js migrationsTableName
 * node get.js migrationsTableName "default value"
 * @type {get}
 */
const get = require('nlab/get');

const config = require('./ormconfig');

const log = require('inspc');

const err = msg => {

    console.log(`general error: ${msg}`);

    process.exit(1);
}

if (process.argv.length < 3) {

    err(`process.argv.length < 3`);
}

const key = process.argv[2];

let data = get(config, key, process.argv[3]);

if (typeof data !== 'string') {

    data = JSON.stringify(data, null, 4);
}

console.log(data);

