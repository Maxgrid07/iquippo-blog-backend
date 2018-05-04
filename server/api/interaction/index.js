'use strict';

var express = require('express');
var auth = require('../../auth/auth.service');
var controller = require('./interaction.controller');
var router = express.Router();
//router.post('/createblog', controller.createBlog);
//router.get('/bloglist', controller.getAllPublishedPosts);
//router.get('/bloglist/:id' , controller.getById);
router.get('/recentposts', controller.getRecentPosts);
router.get('/recentcomments', controller.getRecentComments);
router.post('/likeUnlike',auth.isAuthenticated(), controller.like);
router.post('/comment',auth.isAuthenticated(), controller.comment);
router.get('/comment/:id', controller.getComment);
router.get('/likesCount/:id', controller.getLikesCount);
router.get('/likesInfo/:id', controller.getLikesInfo);
router.get('/commentsInfo/:id', controller.getCommentsInfo);

module.exports = router;