'use strict';

var express = require('express');
var controller = require('./blogasset.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/:id?', controller.index);

module.exports = router;
