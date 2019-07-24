
const path = require('path');

const express = require('express');

const host = '0.0.0.0';

const port = '4455'

const log = require('inspc');

const app = express();

const server    = require('http').createServer(app);

const io        = require('socket.io')(server); // io

io.use(require('socketio-wildcard')());

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

app.all('/test', (req, res) => res.end('test...'));

// for sockets
server.listen( // ... we have to listen on server
    port,
    host,
    undefined, // io -- this extra parameter
    () => {

        console.log(`\n 🌎  Server is running ` + ` ${host}:${port} ` + "\n")
    }
);

