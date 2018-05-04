/**
 * Main application routes
 */

'use strict';

var path = require('path');
var config = require("./config/environment");
var Utility = require("./components/utility");
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (res, file, cb) {
    cb(null, 'server/uploads');
  },
  filename: function (res, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({ storage: storage });

module.exports = function (app) {

  app.route('/blog_api').get(function (req, res) {
    res.json({ message: "Voila, Welcome to Iquippo Blog API." });
  });

  // Insert routes below
  app.use('/auth', require('./auth'));

  app.use('/blog_api/blogs', require('./api/blog'));
  app.use('/blog_api/interaction', require('./api/interaction'));
  app.use('/blog_api/blogbanner', require('./api/blogasset'));
  app.post('/blog_api/blogasset', function (req, res) {
    Utility.handleBlogAsset(req, res);
  });
  app.post('/blog_api/handleupload', upload.fields([ { name: 'imageFiles' } ]), function (req, res) {
    Utility.uploadToS3(req, res);
  });

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.redirect("/");
    });
};
