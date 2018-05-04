/**
 * Main application file
 */

'use strict';

// Set default node environment to development
// require('newrelic');
process.env.NODE_ENV = process.env.NODE_ENV || 'development';


var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
var path = require('path');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function (err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
});

// Setup server
var app = express();
var server = require('http').createServer(app);
var socket=require('socket.io')(server);

var redis = require('socket.io-redis');
socket.adapter(redis({ host: 'localhost', port: 6379 }));

require('./realTimeSocket')(socket);
require('./config/express')(app);

require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, process.env.NODE_ENV);
});

// Expose app
exports = module.exports = app;