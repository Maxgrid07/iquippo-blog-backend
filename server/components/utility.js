"use strict";

var config = require("../config/environment");
var response = require("../components/handleResponse");
var async = require("async");
var BlogAsset = require("../api/blogasset/blogasset.model");
var _ = require("lodash");
var mongoose = require("mongoose");
var AWS = require('aws-sdk');
var S3 = new AWS.S3({
    accessKeyId: config.S3.ACCESS_KEY_ID,
    secretAccessKey: config.S3.SECRET_ACCESS_KEY,
    signatureVersion: config.S3.SIGNATURE_VERSION
});

var Module = (function () {

    var handler = {};

    handler.handleBlogAsset = function (req, res) {
        var reqBody = req.body;

        if (!reqBody) {
            return response.handleError(res, "Cannot upload image without content!", 400);
        }
        if (reqBody._id) {
            _handleExistingBlogAsset(reqBody, res);
        } else {
            _handleNewBlogAsset(reqBody, res);
        }
    }

    handler.uploadToS3 = function (req, res) {
        if (req.files) {
            _handleMultipartRequest(req, res);
        } else {
            this._handleNonMultipartRequest(req, function (err, result) {
                if (err) { return response.handleError(res, err); }
                return response.handleSuccess(res, result);
            });
        }
    }

    // handler.handleThumbnailImage = function (req, cb) {
    //     var reqBody = req;

    //     var _params = {
    //         ACL: config.S3.ACL,
    //         CacheControl: config.S3.CACHE_CONTROL,
    //         Expires: config.S3.EXPIRES,
    //         Bucket: config.S3.BUCKET,
    //         Body: __buffer(reqBody.thumbnailImage.base64),
    //         Key: config.S3.PATH + reqBody.thumbnailImage.filename,
    //         ContentType: 'image/jpeg',
    //         ContentEncoding: 'base64'
    //     };

    //     S3.upload(_params, function (s3Error, s3Response) {
    //         if (s3Error) {
    //             console.log(s3Error);
    //             return cb(s3Error);
    //         } else {
    //             var result = {
    //                 url: config.S3.AWS_URL + config.S3.BUCKET + '/' + s3Response.key,
    //                 msg: 'File uploaded successfully'
    //             };
    //             return cb(null, result);
    //         }
    //     });
    // }

    function _handleNewBlogAsset(reqBody, res) {

        if (!reqBody.blogBannerImage && !reqBody.blogAdImages) {
            return response.handleError(res, "Not sufficient request payload!!", 400);
        }

        var newBlogAsset = reqBody;
        var imageBufferArray = [];

        if (newBlogAsset.blogBannerImage && newBlogAsset.blogBannerImage.base64) {
            imageBufferArray.push(newBlogAsset.blogBannerImage);
            newBlogAsset.blogBannerImage = {};
        }
        if (newBlogAsset.blogAdImages) {
            newBlogAsset.blogAdImages.forEach(function (adImage, key, arrayInstance) {
                if (adImage.image.base64) {
                    var obj = _.cloneDeep(adImage);
                    imageBufferArray.push(obj);
                    delete arrayInstance[key].image;
                }
            });
        }

        newBlogAsset.blogAdImages = [];
        if (imageBufferArray && imageBufferArray.length > 0) {
            __upload(newBlogAsset, imageBufferArray, function (err, result) {
                newBlogAsset = result;
                __saveBlogAsset(newBlogAsset, res);
            });
        } else {
            return response.handleError(res, 'No Content', 400);
        }
    }

    function _handleExistingBlogAsset(reqBody, res) {
        var blogId = reqBody._id;
        delete reqBody._id;

        BlogAsset.findById(blogId).lean().exec(function (err, blogAssetDoc) {
            if (err) { return response.handleError(res, err); }
            if (!blogAssetDoc) { return response.handleError(res, "No asset found with this blog id", 404); }

            var imageBufferArray = [];

            // If blog banner image contains new image to upload
            if (reqBody.blogBannerImage && reqBody.blogBannerImage.base64) {
                imageBufferArray.push(reqBody.blogBannerImage);
                reqBody.blogBannerImage = {};
            }
            // If blog ad images contain new images to upload
            if (reqBody.blogAdImages) {
                reqBody.blogAdImages.forEach(function (adImage, key, arrayInstance) {
                    if (adImage.image && adImage.image.base64) {
                        var obj = _.cloneDeep(adImage);
                        imageBufferArray.push(obj);
                        delete arrayInstance[key].image;
                    }

                    if (adImage._id && adImage.linkUrl) {
                        blogAssetDoc.blogAdImages.forEach(function (item, index, arrayInstance) {
                            if (item._id === adImage._id) {
                                arrayInstance[index].linkUrl = adImage.linkUrl;
                            }
                        });
                    }
                });
            }
            if (imageBufferArray && imageBufferArray.length > 0) {
                __upload(blogAssetDoc, imageBufferArray, function (err, result) {
                    if (err) {
                        return response.handleError(res, err);
                    }
                    blogAssetDoc = result;
                    console.log('Update with image');
                    __updateBlogAsset(blogAssetDoc, null, res);
                });
            } else {
                console.log('Update without image');
                __updateBlogAsset(blogAssetDoc, reqBody, res);
            }

        });
    }

    function __upload(newBlogAsset, imageBufferArray, cb) {
        async.eachOfSeries(imageBufferArray, function (imageObj, index, done) {
            console.log('Uploading --- ', index);
            var _params = {
                ACL: config.S3.ACL,
                CacheControl: config.S3.CACHE_CONTROL,
                Expires: config.S3.EXPIRES,
                Bucket: config.S3.BUCKET,
                ContentType: 'image/jpeg',
                ContentEncoding: 'base64'
            }
            if (imageObj.linkUrl && imageObj.image) {
                _params['Key'] = config.S3.PATH + imageObj.image.filename;
                _params['Body'] = __buffer(imageObj.image.base64);
            } else {
                _params['Key'] = config.S3.PATH + imageObj.filename;
                _params['Body'] = __buffer(imageObj.base64);
            }

            S3.upload(_params, function (s3Error, s3Response) {
                if (s3Error) {
                    console.log(s3Error);
                    done(s3Error);
                } else {
                    if (imageObj._id) {
                        newBlogAsset['blogAdImages'].forEach(function (item, key, arrayInstance) {
                            if (item._id.toString() === imageObj._id.toString()) {
                                arrayInstance[key].linkUrl = imageObj.linkUrl;
                                arrayInstance[key].imageUrl = config.S3.AWS_URL + config.S3.BUCKET + '/' + s3Response.key;
                                arrayInstance[key].filename = imageObj.image ? imageObj.image.filename : imageObj.filename;
                                console.log(arrayInstance[key]);
                            }
                        });
                    }
                    if (!imageObj._id && imageObj.linkUrl && imageObj.image) {
                        newBlogAsset['blogAdImages'].push({
                            _id: mongoose.Types.ObjectId(),
                            imageUrl: config.S3.AWS_URL + config.S3.BUCKET + '/' + s3Response.key,
                            filename: imageObj.image ? imageObj.image.filename : imageObj.filename,
                            linkUrl: imageObj.linkUrl
                        });
                    }
                    if (!imageObj._id && !imageObj.linkUrl && !imageObj.image) {
                        newBlogAsset['blogBannerImage'].url = config.S3.AWS_URL + config.S3.BUCKET + '/' + s3Response.key;
                        newBlogAsset['blogBannerImage'].filename = imageObj.image ? imageObj.image.filename : imageObj.filename;
                    }
                    console.log('Done');
                    done();
                }
            });
        }, function (err) {
            if (err) {
                return cb(err);
            }
            return cb(null, newBlogAsset);
        });
    }

    function __fileExtension(filename) {
        return filename.split('.')[filename.split('.').length - 1];
    }

    function __buffer(data) {
        return new Buffer(data, "base64");
    }

    function __saveBlogAsset(data, res) {
        console.log('Saving blog asset...');
        var newAsset = new BlogAsset(data);
        newAsset.save(function (err, result) {
            if (err) { return response.handleError(res, err); }
            return response.handleSuccess(res, result);
        });
    }

    function __updateBlogAsset(blogAssetDoc, reqBody, res) {
        if (reqBody) {
            var updated = _.merge(blogAssetDoc, reqBody);
        } else {
            var updated = blogAssetDoc;
        }

        BlogAsset.findOneAndUpdate({ _id: blogAssetDoc._id }, updated, { new: true }, function (err, result) {
            if (err) { return response.handleError(res, err); }
            return response.handleSuccess(res, result);
        });
    }

    function _handleMultipartRequest(req, res) {
        if (!req.files || (req.files && req.files.length === 0)) {
            return response.handleError(res, 'File missing', 400);
        }
        if (!req.file.imageFiles) {
            return response.handleError(res, 'Invalid parameter!', 400);
        }
        if (req.files.imageFiles && req.files.imageFiles.length === 0) {
            return response.handleError(res, 'File missing with parameter!', 400);
        }
        return response.handleSuccess(res, 'File uploaded successfuly');
    }

    handler._handleNonMultipartRequest = function (req, cb) {
        console.log('Non multipart...');
        var reqBody = req.body || req;

        if (!reqBody.imageFile) {
            return cb('Invalid parameter!');
        }
        if (!reqBody.imageFile.base64) {
            return cb('File missing!');
        }

        var _params = {
            ACL: config.S3.ACL,
            CacheControl: config.S3.CACHE_CONTROL,
            Expires: config.S3.EXPIRES,
            Bucket: config.S3.BUCKET,
            ContentType: 'image/jpeg',
            ContentEncoding: 'base64'
        };

        if (reqBody.thumbnailImage) {
            _params['Body'] = __buffer(reqBody.thumbnailImage.base64);
            _params['Key'] = config.S3.PATH + reqBody.thumbnailImage.filename;
        } else {
            _params['Body'] = __buffer(reqBody.imageFile.base64);
            _params['Key'] = config.S3.PATH + reqBody.imageFile.filename;
        }

        S3.upload(_params, function (s3Error, s3Response) {
            if (s3Error) {
                console.log(s3Error);
                return cb(s3Error);
            } else {
                var result = {
                    url: config.S3.AWS_URL + config.S3.BUCKET + '/' + s3Response.key,
                    msg: 'File uploaded successfully'
                };
                return cb(null, result);
            }
        });

    }

    return handler;

})();

module.exports = Module;