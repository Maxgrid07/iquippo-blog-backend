"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var seqGenerator = require('./../models/seqgenerator');
var BLOG_CONSTANTS = require("../../config/values");

var TagMasterSchema = new Schema({
    name: String,
    postCount: Number,
    slug: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

TagMasterSchema.pre('save', function (next) {
    var self = this;
    self.slug = this.makeSlug(self.name);
    next();
});

TagMasterSchema.methods = {
    makeSlug: function (title) {
        var regex = /[!\u0964\u0965\u097D$^&%*()_+|~=`'{}\[\];<>?@#,.\/:-]+/gi;
        var titleArray = title.replace(regex, " ").split(" ");
        return _titleArray.filter(function (element) {
            return element !== ""
        }).join("-");
    }
}

module.exports = mongoose.model('TagMaster', TagMasterSchema);