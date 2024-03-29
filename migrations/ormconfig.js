
require('dotenv-up')({
   override    : false,
   deep        : 3,
}, false, 'ormconfig.js');

const config = {
   "type": "mysql",
   "host": process.env.PROTECTED_MYSQL_HOST,
   "port": process.env.PROTECTED_MYSQL_PORT,
   "username": process.env.PROTECTED_MYSQL_USER,
   "password": process.env.PROTECTED_MYSQL_PASS,
   "database": process.env.PROTECTED_MYSQL_DB,
   "synchronize": false,
   "logging": false,
   // "migrationsTableName": "custom_migration_table",
   // "logging": "query", // "query", "error", "schema"
   "exclude": [
      "node_modules"
   ],
   // "migrationsTableName": "migration_versions",
   "entities": [
      "src/entity/**/*.ts"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "subscribers": [
      "src/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
   }
}

module.exports = config;
