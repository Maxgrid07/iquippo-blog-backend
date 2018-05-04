"use strict";

var BlogAsset = require("./blogasset.model");
var _ = require("lodash");
var config = require("../../config/environment");
var response = require("../../components/handleResponse");

exports.index = function (req, res) {
    if (req.params.id) {
        BlogAsset.findById(req.params.id).lean().exec(function (err, blogAssetDoc) {
            if (err) { return response.handleError(res, err); }
            return response.handleSuccess(res, blogAssetDoc);
        });
    } else {
        BlogAsset.find().lean().exec(function (err, blogAssetDoc) {
            if (err) { return response.handleError(res, err); }
            return response.handleSuccess(res, blogAssetDoc);
        });
    }
}