
import "reflect-metadata";

import {createConnection} from "typeorm";

createConnection({
    "type": "mysql",
    "host": "x.x.x.x",
    "port": 3306,
    "username": "typeorm-test",
    "password": "typeorm-test-ppp",
    "database": "typeorm-test",
    // "synchronize": false, // automatically update schema - dangerous on prod
    "synchronize": false, // automatically update schema - dangerous on prod
    "logging": true,
    "entities": [
        "src/entity/**/*.ts"
    ],
    "migrations": [
        "src/migration/**/*.ts"
    ],
    "migrationsTableName": "custom_migration_table",
    "subscribers": [
        "src/subscriber/**/*.ts"
    ],
    "cli": {
        "entitiesDir": "src/entity",
        "migrationsDir": "src/migration",
        "subscribersDir": "src/subscriber"
    }
}).then(async connection => {

    console.log('stop...');

    await connection.close();

    // process.exit(0)

    // console.log("Inserting a new user into the database...");
    // const user = new User();
    // user.firstName = "Timber";
    // user.lastName = "Saw";
    // user.age = 25;
    // await connection.manager.save(user);
    // console.log("Saved a new user with id: " + user.id);
    //
    // console.log("Loading users from the database...");
    // const users = await connection.manager.find(User);
    // console.log("Loaded users: ", users);
    //
    // console.log("Here you can setup and run express/koa/any other framework.");

}).catch(error => console.log(error));
