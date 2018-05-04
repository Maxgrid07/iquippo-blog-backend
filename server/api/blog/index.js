'use strict';

var express = require('express');
var controller = require('./blog.controller');
var auth = require('../../auth/auth.service');
var multer  = require('multer');

var storage = multer.diskStorage({
    destination : function(req, file, cb) {
        cb(null, 'server/uploads');
    },
    filename : function(req, file, cb) {
        cb(null, file.originalname);
    }
});
var upload = multer({ storage : storage });

var router = express.Router();

router.get('/:id?', controller.index);
router.post('/', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);

module.exports = router;
