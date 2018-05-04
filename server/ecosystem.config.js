'use strict';
var path = require('path');


module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [{
    name: "iquippo Blog API server",
    script: "server/app.js",
    env: {
      NODE_ENV: process.env.NODE_ENV
    },
    "exec_mode": "fork",
    "instances": 1,
    "log_date_format": "YYYY-MM-DD HH:mm Z"
  }]
}