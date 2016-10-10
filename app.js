// dependencies
var http = require('http');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var mongoose = require('mongoose');
var dotenv = require('dotenv').config();

// environment variables setup
var envs = ['MONGO_URL', 'NODE_PORT'];
for (var key in envs) {
    var env = envs[key];
    if (!process.env[env]) {
        console.log(env + ' environment variable could not be found... exiting');
        process.exit(1);
    }
}

// express setup
var app = express();

// logger setup
app.use(logger('dev'));

// mongodb/mongoose setup
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL);

// routes
var api = require('./routes/api');
app.use('/', api);

// server listen setup
var port = process.env.NODE_PORT;
app.set('port', port);
var server = http.createServer(app);
server.listen(port);
server.on('error', onServerError);
server.on('listening', onServerListening);

function onServerError(error) {
    if (error.syscall != 'listen') {
        throw error;
    }
    switch (error.code) {
        case 'EACCES':
            console.err('Port ' + port + ' requires elevated privileges');
            console.exit(1);
            break;
        case 'EADDRINUSE':
            console.err('Port ' + port + ' is already in use');
            console.exit(1);
            break;
        default:
            throw error;
    }
}

function onServerListening() {
    console.log('Listening on port ' + port);
}

module.exports = app;




