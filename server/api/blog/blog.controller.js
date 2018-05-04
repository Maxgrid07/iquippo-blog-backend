'use strict';

var fs = require('fs');
var mongoose = require("mongoose");
var _ = require("lodash");
var config = require("../../config/environment");
var BLOG_CONSTANTS = require("../../config/values");
var response = require("../../components/handleResponse");
var BlogMaster = require("./blog.model");
var Utility = require("../../components/utility");

exports.index = function (req, res) {
    if (req.params.id) {
        BlogMaster.findById(req.params.id).lean().exec(function (err, blogs) {
            if (err) { return response.handleError(res, err); }
            if (!blogs || blogs.length == 0) { return response.handleSuccess(res, []); }
            return response.handleSuccess(res, blogs);
        });
    } else {
        var filter = {};
        if (req.query && req.query.ref === "app") {
            filter = {
                isDeleted: false,
                status: BLOG_CONSTANTS.STATUS.MAP.PUBLISHED,
                publishedAt: { $lte: new Date() }
            };
            BlogMaster.find(filter).sort({ createdAt: -1 }).lean().exec(function (err, blogs) {
                if (err) { return response.handleError(res, err); }
                if (!blogs || blogs.length == 0) { return response.handleSuccess(res, []); }
                return response.handleSuccess(res, blogs);
            });
        } else {
            var blogSchema = new BlogMaster({});
            filter = {};
            BlogMaster.find(filter).lean().exec(function (err, blogs) {
                if (err) { return response.handleError(res, err); }
                if (!blogs || blogs.length == 0) { return response.handleSuccess(res, []); }
                blogSchema.filter(blogs);
                return response.handleSuccess(res, blogs);
            });
        }
    }
}

exports.create = function (req, res) {
    var newBlog = req.body;
    newBlog['publisher'] = {};
    newBlog['_id'] = mongoose.Types.ObjectId();

    if (req.body.publishedAt) {
        if (_isBeforeToday(req.body.publishedAt)) {
            return response.handleError(res, 'Cannot create blog with published date before today', 400);
        }
        if (!req.user) {
            return response.handleError(res, 'Not authorized to create blog', 401);
        }

        newBlog['status'] = BLOG_CONSTANTS.STATUS.MAP.PUBLISHED;
        var userObj = {
            '_id': req.user._id,
            'name': req.user.fname + ' ' + req.user.lname,
            'email': req.user.email,
            'mobile': req.user.mobile
        };
        newBlog['publisher'] = userObj;
    }

    if (newBlog.thumbnailImage) {
        Utility._handleNonMultipartRequest(newBlog, function (err, result) {
            if (err) { return response.handleError(res, err); }
            newBlog['thumbnailImage'].url = result.url;
            delete newBlog['thumbnailImage']['base64'];
            _saveBlog(newBlog, res);
        });
    } else {
        return response.handleError(res, 'Invalid thumbnail image parameter', 400);
    }

};

function _saveBlog(data, res) {
    BlogMaster.create(data, function (err, result) {
        if (err) { return response.handleError(res, err.message || err); }
        return response.handleSuccess(res, result);
    });
}

exports.update = function (req, res) {

    var blogId = req.params.id;
    BlogMaster.findById(blogId).exec(function (err, blog) {
        if (err) { return response.handleError(res, err); }
        if (!blog) { return response.handleSuccess(res, [], 404); }

        if (blog.status !== req.body.status) {
            if (req.body.status === BLOG_CONSTANTS.STATUS.MAP.PUBLISHED) {
                req.body.lastPublishedAt = req.body.publishedAt ? req.body.publishedAt : Date.now();
            }
            if (req.body.status === 'unpublish') {
                blog.isDeleted = true;
                delete req.body.status;
            }
        }
        _updateBlog(blog, req.body, res);
    });

}

function _updateBlog(blog, reqBody, res) {
    var updated = _.merge(blog, reqBody);

    BlogMaster.findOneAndUpdate({ _id: blog._id }, updated, { new: true }, function (err, result) {
        if (err) { return response.handleError(res, err.message || err); }
        return response.handleSuccess(res, result);
    });
}

function _isBeforeToday(dt) {
    return (new Date(dt) < new Date());
}