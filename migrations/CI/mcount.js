/**
 * Script to determine how many migrations were executed until now
 */
const path = require('path');

const { createConnection } = require("typeorm");

const config = require(path.resolve(__dirname, '..', 'ormconfig.js'));

const log = require('inspc');

(async () => {

    let connection;

    try {

        connection = await createConnection(config);

        let list = await connection.manager.query(`show tables`);

        const migrationsTableName = connection.options.migrationsTableName || 'migrations';

        list = list.map(RowDataPacket => Object.values(RowDataPacket)[0]);

        const found = !! (list.find(t => t === migrationsTableName) || []).length;

        let count = '0';

        if (found) {

            count = await connection.manager.query(`select count(*) c from ??`, [migrationsTableName]);

            count = Object.values(count[0])[0];
        }

        process.stdout.write(count);

        await connection.close();
    }
    catch (e) {

        console.log('CATCH ERROR: ', e);

        await connection.close();

        setTimeout(() => process.exit(1), 1);

        throw e;
    }

})()
