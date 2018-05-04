"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var seqGenerator = require("../../components/seqgenerator");
var BLOG_CONSTANTS = require("../../config/values");
var RevisionHistory = require("../histroy/history.model");

var BlogAssetMasterSchema = new Schema({
    blogBannerImage: {
        url: String,
        filename: String
    },
    blogAdImages: [{
        _id: Schema.Types.ObjectId,
        imageUrl: String,
        filename: String,
        linkUrl: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BlogAssetMaster', BlogAssetMasterSchema);