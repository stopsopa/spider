
require('dotenv-up')({
    override    : false,
    deep        : 3,
}, true, 'server.js');

const path                  = require('path');

const log                   = require('inspc');

const express               = require('express');

const host                  = process.env.NODE_HOST;

const port                  = process.env.NODE_PORT;

const app                   = express();

const server    = require('http').createServer(app);

const io        = require('socket.io')(server); // io

// https://stackoverflow.com/a/37159364/5560682
io.use(require('socketio-wildcard')());

const knex              = require('knex-abstract');

knex.init(require(path.resolve(__dirname, 'app', 'models', 'config')));

app.use(express.static(path.resolve(__dirname, '.')));

// https://github.com/expressjs/express/blob/4.16.4/lib/express.js#L81
// https://expressjs.com/en/4x/api.html#express.urlencoded
// app.use(bodyParser.urlencoded({extended: false})); // no need to do it like this because bodyParser is part of express
app.use(express.urlencoded({extended: false}));

// https://github.com/expressjs/express/blob/4.16.4/lib/express.js#L78
// https://expressjs.com/en/4x/api.html#express.json
// app.use(bodyParser.json()); // no need to do it like this because bodyParser is part of express
app.use(express.json());

app.use(require('./src')({
    io
}));

// for sockets
server.listen( // ... we have to listen on server
    port,
    host,
    undefined, // io -- this extra parameter
    () => {
        console.log(`\n 🌎  Server is running ` + ` ${host}:${port} ` + "\n")
    }
);

