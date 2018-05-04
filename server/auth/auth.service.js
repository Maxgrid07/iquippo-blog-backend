'use strict';

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
// var User = require('../api/user/user.model');
var request = require('request');
var validateJwt = expressJwt({ secret: config.secrets.session });
var Blog = require('../api/blog/blog.model');

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
    // Validate jwt
    .use(function (req, res, next) {
      // allow access_token to be passed through query parameter as well
      if (req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }

      if (req.cookies && req.cookies.token) {
        try {
          req.headers.authorization = 'Bearer ' + JSON.parse(req.cookies.token);
        } catch (exc) {
          return next(exc);
        }
      }

      validateJwt(req, res, next);
    })
    // Attach user to request
    .use(function (req, res, next) {
      var options = {
        method: 'get',
        json: true,
        baseUrl: 'http://localhost:8100/',
        url: 'api/users/' + req.user._id,
        headers: {
          'Authorization': req.headers.authorization
        }
      };
      request(options, function (err, response, body) {
        if (err) return next(err);
        if (response.statusCode !== 200) {
          return res.status(response.statusCode).send('Unauthorized');
        } else {
          req.user = body;
          // Blog.setUserInSession(req.user);
          next();
        }
      });
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        next();
      }
      else {
        res.status(403).send('Forbidden');
      }
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id, role, expireTime) {
  if (!expireTime)
    expireTime = 60 * 5;
  return jwt.sign({ _id: id }, config.secrets.session, { expiresInMinutes: expireTime });
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) return res.status(404).json({ message: 'Something went wrong, please try again.' });
  var token = signToken(req.user._id, req.user.role);
  res.cookie('token', JSON.stringify(token));
  res.redirect('/');
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;