'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config/environment');
var User = require('../api/user/user.model');
var auth = require("./auth.service");
var extAuth = require("./externalauth.service");
// Passport Configuration
require('./local/passport').setup(User, config);

var router = express.Router();

router.use('/local', require('./local'));

//Authentication for external client
router.get("/gettoken",extAuth.isAuthenticated(),extAuth.getToken);
router.get("/tokenandurl",extAuth.getTokenAndRedirectUrl);
router.get("/validate",extAuth.isAuthenticated(),extAuth.validate);


module.exports = router;