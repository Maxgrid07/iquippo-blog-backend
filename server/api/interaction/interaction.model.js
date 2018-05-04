"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var InteractionSchema = new Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    email: { type: String, lowercase: true },
    mobile: String,
    reactions: [{
        _id: Schema.Types.ObjectId,
        likeStatus: Boolean,
        createdAt: Date,
        postId: Schema.Types.ObjectId
    }],
    comments: [{
        _id: Schema.Types.ObjectId,
        postId: { type: Schema.Types.ObjectId, ref: "BlogMaster" },
        message: String,
        createdAt: { type: Date, default: Date.now }
    }],
    bookmarks: [{
        _id: Schema.Types.ObjectId,
        createdAt: Date
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interaction', InteractionSchema);