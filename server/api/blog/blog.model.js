"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var seqGenerator = require("../../components/seqgenerator");
var BLOG_CONSTANTS = require("../../config/values");
var RevisionHistory = require("../histroy/history.model");

var BlogMasterSchema = new Schema({
    blogId: String,
    title: String,
    slug: String,
    likes: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    text: String,
    language: {
        type: String,
        required: true,
        lowercase: true,
        enum: BLOG_CONSTANTS.LANGUAGE.VALUES,
        default: BLOG_CONSTANTS.LANGUAGE.DEFAULT
    },
    videos: [{
        _id: Schema.Types.ObjectId,
        caption: String,
        url: String
    }],
    thumbnailImage: {
        filename: String,
        url: String
    },
    status: {
        type: String,
        required: true,
        lowercase: true,
        enum: BLOG_CONSTANTS.STATUS.VALUES,
        default: BLOG_CONSTANTS.STATUS.DEFAULT
    },
    tags: [],
    categories: [{}],
    brands: [{}],
    models: [{}],
    author: {
        name: { type: String, required: true },
        email: { type: String, lowercase: true },
        mobile: String,
        bio: String
    },
    publisher: {
        _id: Schema.Types.ObjectId,
        name: String,
        email: { type: String, lowercase: true },
        mobile: String
    },
    publishedAt: Date,
    lastPublishedAt: Date,
    isDeleted: { type: Boolean, default: false },
    isCommentable: { type: Boolean, default: true },
    revisionHistory: { type: Schema.Types.ObjectId, ref: 'RevisionHistory' },
    interactions: { type: Schema.Types.ObjectId, ref: 'Interaction' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

/**
 * Validate if request body contains thumbnail image or not
 */
BlogMasterSchema.pre('validate', function (next) {
    var self = this;
    if (!self.thumbnailImage) {
        var err = new Error("Blog thumbnail image is mandatory.");
        next(err);
    }
    next();
});

BlogMasterSchema.pre('save', function (next) {
    var self = this;
    var prefix = 'BG';
    var sequence = seqGenerator.sequence();
    sequence.next(function (seqnum) {
        self.blogId = prefix + seqnum;
        return next();
    }, 'blog', 100002);
});

BlogMasterSchema.pre('save', function (next) {
    var self = this;
    self.slug = this.slugHandler(self.title);
    self.updatedAt = Date.now();
    next();
});

// BlogMasterSchema.post('save', function(doc) {
//     var self = this;
//     var data = {
//         blogId: doc._id,
//         userId: self.userInSession,
//         savedAt: Date.now()
//     };
//     var newHistory = new RevisionHistory(data);
//     newHistory.save(function(err, result) {
//         if(err) { next(err); }
//     });
//     // Find one and update
//     next();
// });

BlogMasterSchema.methods = {
    /**
     * Handler for creating slug using blog title
     */
    slugHandler: function (title) {
        var regex = /[!\u0964\u0965\u097D$^&%*()_+|~=`'{}\[\];<>?@#,.\/:-]+/gi;
        var _titleArray = title.replace(regex, " ").split(" ");
        return _titleArray.filter(function (element) {
            return element !== ""
        }).join("-").toLowerCase();
    },
    setUserInSession: function (user) {
        this.userInSession = user;
    },
    getUserInSession: function () {
        return this.userInSession;
    },
    /**
     * Handler for returning selected fields for blog listing in iQuippo Admin
     */
    filter: function (docs, type) {
        docs.forEach(function (doc, key) {
            var obj = {
                '_id': this[key]._id,
                'blogId': this[key].blogId,
                'title': this[key].title,
                'publishedAt': this[key].publishedAt,
                'likes': this[key].likes,
                'commentCount': this[key].commentCount,
                'status': this[key].status,
                'isDeleted': this[key].isDeleted,
                'author': this[key].author
            };
            this[key] = obj;
        }, docs);
        return docs;
    }
};

module.exports = mongoose.model('BlogMaster', BlogMasterSchema);