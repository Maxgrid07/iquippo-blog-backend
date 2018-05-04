'use strict';

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var seqGenerator = require("../../components/seqgenerator");
var BLOG_CONSTANTS = require("../../config/values");

var RevisionHistorySchema = new Schema({
    blogId: { type: Schema.Types.ObjectId, ref: 'BlogMaster' },
    rev: Number,
    userId: Schema.Types.ObjectId,
    savedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RevisionHistory', RevisionHistorySchema);