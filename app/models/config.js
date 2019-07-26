
require('dotenv-up')({
    override    : false,
    deep        : 3,
}, false, 'tests');

const mysql = require('./mysql');

module.exports = {
    def: 'mysql',
    mysql: {
        // CREATE DATABASE IF NOT EXISTS `dashboard` /*!40100 DEFAULT CHARACTER SET utf8 */
        // GRANT ALL PRIVILEGES ON dashboard.* To 'dashboard'@'%' IDENTIFIED BY 'pass';
        // SHOW GRANTS FOR 'dashboard';
        // DROP USER 'dashboard'
        client: 'mysql',
        connection: {
            host                : process.env.PROTECTED_MYSQL_HOST,
            port                : process.env.PROTECTED_MYSQL_PORT,
            user                : process.env.PROTECTED_MYSQL_USER,
            password            : process.env.PROTECTED_MYSQL_PASS,
            database            : process.env.PROTECTED_MYSQL_DB,
            multipleStatements  : true, // this flag makes possible to execute queries like this:
                // `SET @x = 0; UPDATE :table: SET :sort: = (@x:=@x+1) WHERE :pid: = :id ORDER BY :l:`
                // its mainly for nested set extension library https://github.com/stopsopa/knex-abstract/blob/master/src/lr-tree.js
        },
        pool: {
            afterCreate: function(conn, cb) {
                // https://knexjs.org#Installation-pooling-afterCreate
                // https://stackoverflow.com/a/46277941/5560682

                conn.query(`SET SESSION sql_mode=(SELECT REPLACE(@@SESSION.sql_mode,'ONLY_FULL_GROUP_BY',''))`, function (err) {
                    cb(err, conn);
                });
            }
        },
        models: mysql,
    },
};