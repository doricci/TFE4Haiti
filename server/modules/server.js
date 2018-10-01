'use strict';

/**
 * =============================
 *
 * API Express server
 * Set the route listening on, start/stop the server...
 *
 * =============================
 *
 * Attributes : /
 *
 * Methods :
 *    - start([callback])
 *    - stop([callback])
 *
 * Events : /
 *
 * =============================
 */

/**
 * Load modules
 */

// Built-in
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var nconf = require('nconf');

// Custom
var logger = require('./logger');
var config = require('./config');
const token = require('./token');
var permission = require('./permission');


// Routes

/**
 * Variables
 */
// Server
var app = express();
//var api = express.Router();
var server;



/**
 * Configure application:
 *    - parse json bodies
 */


/**
 * Configure application routes
 */
var _configureRoutes = function() {

  /*  require("../routes/server");
    require('../routes/user');
    require('../routes/login');*/


  // prefix of api url
  app.use('/api', require('../routes'));

  app.use("*", function(req, res) {
    res.status(404).send({ message: '404' });
  });

  logger.info('[SERVER] Routes loaded');
};

/**
 * Start the API Server
 *
 * @param callback function called when the web server is listening
 */
var start = function(callback) {
  _configureDB();
  _configureServer();
  _configureRoutes();

};

/**
 * Stop the API Server
 *
 * @param callback function called when the web server is no more listening
 */
var stop = function(callback) {
  if (server && typeof server.close === 'function') {
    server.close();
    logger.warn('[Server] Web server no more listening on ' + nconf.get('server:host') + ':' + process.env.PORT);
    if (callback) callback();
  } else {
    logger.warn('[Server] Cannot stop web server listening on ' + nconf.get('server:host') + ':' + process.env.PORT);
    if (callback) callback();
  }
};


/**
 * Exports
 */

// Methods
exports.start = start;
exports.stop = stop;

// exports.registerRoute = function(method, path, handler) {
//   logger.info('[Server] Registering route ' + method + ' ' + path);
//   return api[method.toLowerCase()](path, handler);
// };

// exports.registerAuthRoute = function(method, path, handler, roles) {
//   logger.info('[Server] Registering Auth route ');
//   api[method.toLowerCase()](path, token.validateToken);
//
//   api[method.toLowerCase()](path, permission.isAllowed(roles));
//   return exports.registerRoute(method, path, handler);
// };