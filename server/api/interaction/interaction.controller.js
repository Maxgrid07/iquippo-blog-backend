var _ = require('lodash');
var ObjectID = require('mongodb').ObjectID;

var blogConstants = require("../../config/values");
var BlogMaster = require('../blog/blog.model');
var Interaction = require('../interaction/interaction.model');
var response = require("../../components/handleResponse");

var _sendAndUpdateViaSocket = require('../../realTimeSocket')._sendAndUpdateViaSocket;
// Create a test blog 
// exports.createBlog = function (req, res) {
//  console.log('Hello');
//      var posts = req.body.posts;
//  var status = req.body.status;
//  //getting username from local storage
//  console.log(req);
//  BlogMaster.create(req.body, function(err, post) {
//      if (err) return next(err);
//      res.json(post);
//  });
// };

// Get List of all blogposts with status published
// exports.getAllPublishedPosts = function(req, res) {
//     var filter = {};
//     filter["status"] = "published";
//     BlogMaster.find(filter).sort({ createdAt: -1 }).exec(function(err, posts) {
//         if (err) { return handleError(res, err); }
//         return res.status(200).json(posts);
//     });
// };

// Get a single post by Id -- for ream more
// exports.getById = function(req, res) {
//     var id = req.params.id;
//     if (!ObjectID.isValid(id)) {
//         return res.status(404).send('ObjectId is invalid');
//     }
//     BlogMaster.findById({ _id: id }, function(err, posts) {
//         if (err) { return handleError(res, err); }
//         return res.status(200).json(posts);
//     });
// };
// Increment & Decrement likes count for a particular post by _id
// exports.like = function(req, res) {
//     console.log(req.user);
//     var userEmail = req.user.email;
//     var userPhone = req.user.mobile;
//     var name = req.user.fname;
//     var userId = req.user._id;
//     var postId = req.body.id || '';
//     if (postId == '') {
//         return res.send(400);
//     }
//     // var likeStatus = req.body.likeStatus;
//     var count = 0;
//     Interaction.findById({ _id: userId }, function(err, userDoc) {
//         if (err) { return handleError(res, err); }
//         if (userDoc) {
//             if (userDoc.reaction.likeStatus === true) {
//                 updateBlogMaster(req, res, postId, -1);
//                 updateInteraction(userId, false, postId);
//             } else {
//                 updateBlogMaster(req, res, postId, 1);
//                 updateInteraction(userId, true, postId);
//             }
//         } else {
//             updateBlogMaster(req, res, postId, 1);
//             Interaction.create({ _id: userId, name: name, email: userEmail, mobile: userPhone, reaction: { likeStatus: true, postId: postId } }, function(err, nbRows) {
//                 if (err) {
//                     console.log(err); //$push: { reactions: { likeStatus: true, postId: postId } } 
//                 } else {
//                     console.log('Interaction created for the post liked');
//                 }
//             });
//         }
//     });
// };

exports.like = function(req, res) {
    console.log(req.user);
    var userEmail = req.user.email;
    var userPhone = req.user.mobile;
    var name = req.user.fname;
    var userId = req.user._id;
    var postId = req.body.id || '';
    if (postId == '') {
        return res.send(400);
    }
    // var likeStatus = req.body.likeStatus;
    var ismatch = false;
    var count = 0;
    Interaction.findById({ _id: userId }, function(err, userDoc) {
        if (err) { return handleError(res, err); }
        if (userDoc) {
            userDoc.reactions.forEach(function(reaction) {
                if (reaction.postId.toString() == postId.toString()) {
                    ismatch = true;
                    if (reaction.likeStatus == true) {
                        updateBlogMaster(req, res, postId, -1);
                        updateInteraction(userId, false, postId, userDoc);
                    } else {
                        updateBlogMaster(req, res, postId, 1);
                        updateInteraction(userId, true, postId, userDoc);
                    }
                }
            });
            if (!ismatch) {
                Interaction.findOneAndUpdate({ _id: userId }, { $push: { reactions: { likeStatus: true, postId: postId } } }, function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Interaction updated for the post liked');
                    }
                });
                updateBlogMaster(req, res, postId, 1);
            }
        } else {

            updateBlogMaster(req, res, postId, 1);
            Interaction.create({ _id: userId, name: name, email: userEmail, mobile: userPhone, reactions: [{ likeStatus: true, postId: postId }] }, function(err, nbRows) {
                if (err) {
                    console.log(err); //$push: { reactions: { likeStatus: true, postId: postId } } 
                } else {
                    console.log('Interaction created for the post liked');
                }
            });
        }
    });
};

function updateBlogMaster(req, res, postId, incOrDec) {
    BlogMaster.findOneAndUpdate({ _id: postId }, { $inc: { likes: incOrDec } }, { new: true }, function(err, doc) {
        if (err) {
            console.log(err);
        }
        _sendAndUpdateViaSocket('onLikePost', { likesCount: doc.likes });
        return res.send(200);
    });

}

function updateInteraction(userId, bool, postId, userDoc) {
    userDoc = userDoc.toObject();
    userDoc.reactions.forEach(function(reaction, index, arrInstance) {
        if (reaction.postId == postId) {
            arrInstance[index].likeStatus = bool;
        }
        Interaction.findOneAndUpdate({ _id: userId }, userDoc, { upsert: true }, function(err, doc) {
            if (err) {
                return res.send(400);
            }
        });
    });
}

// Add a comment for a particular post by _id
exports.comment = function(req, res) {
    var name = req.user.fname;
    var postId = req.body.id || '';
    var comment = req.body.comment || '';
    var userId = req.user._id;
    var userEmail = req.user.email;
    var userPhone = req.user.mobile;
    if (postId == '' || comment == '') {
        return res.send(400);
    }
    Interaction.findOneAndUpdate({ _id: userId }, { email: userEmail, name: name, mobile: userPhone, $push: { comments: { message: comment, postId: postId } } }, { upsert: true }, function(err, userDoc) {
        if (err) { return response.handleError(res, err); }
        _sendAndUpdateViaSocket('onPostComment', { user: name, postId: postId, message: comment, createdAt: new Date() });
        return res.status(200).json(userDoc);
    });
    BlogMaster.findOneAndUpdate({ _id: postId }, { $inc: { commentCount: 1 } }, { new: true }, function(err, doc) {
        if (err) {
            return res.send(400);
        }
        _sendAndUpdateViaSocket('onLikePost', { likesCount: doc.likes });
        //return res.send(200);
    });


};

exports.getComment = function(req, res) {
    // var postId = req.params.id || '';
    // if (postId == '') {
    //     return res.send(400);
    // }
    // Interaction.find({ 'comments.postId': postId }, function(err, results) {
    //     if (err) { return response.handleError(res, err); }
    //     return res.status(200).json(results);
    // });
    // var user = req.user.fname;
    var comments = [];
    var postId = new ObjectID(req.params.id);
    Interaction.aggregate({ "$unwind": "$comments" }, { "$match": { "comments.postId": postId } },
        function(err, aggrDocs) {
            if (err) { return response.handleError(res, err); }
            aggrDocs.forEach(function(aggDoc) {
                var comment = {};
                comment['user'] = aggDoc.name;
                comment['postId'] = aggDoc.comments.postId;
                comment['createdAt'] = aggDoc.createdAt;
                comment['message'] = aggDoc.comments.message;
                comments.push(comment);
            });
            return res.status(200).json(comments);
        });
};

exports.getLikesCount = function(req, res) {
    var postId = req.params.id || '';
    console.log(postId);
    if (postId == '') {
        return res.send(400);
    }
    BlogMaster.findOne({ _id: postId }, function(err, results) {
        if (err) { return response.handleError(res, err); }
        return res.status(200).json(results.likes);
    });
};

exports.getRecentPosts = function(req, res) {
    BlogMaster.find().sort({ createdAt: -1 }).limit(4).exec(function(err, posts) {
        if (err) { return response.handleError(res, err); }
        return res.status(200).json(posts);
    });
};

exports.getLikesInfo = function(req, res) {
    var reactions = [];
    var postId = new ObjectID(req.params.id);
    Interaction.aggregate({ "$unwind": "$reactions" }, { "$match": { "reactions.postId": postId } },
        function(err, aggrDocs) {
            if (err) { return response.handleError(res, err); }
            aggrDocs.forEach(function(aggDoc) {
                var reaction = {};
                reaction['name'] = aggDoc.name;
                reaction['email'] = aggDoc.email;
                reaction['mobile'] = aggDoc.mobile;
                reactions.push(reaction);
            });
            return res.status(200).json(reactions);
        });
}

exports.getRecentComments = function(req, res) {
    var recentComments = [];
    Interaction.find().populate('comments.postId', ['title']).sort({ "comments.createdAt": -1 }).limit(4).lean().exec(function(err, userDocs) {
        if (err) { return response.handleError(res, err); }
        userDocs.forEach(function(userDoc) {
            userDoc.comments.forEach(function(comment) {
                comment['name'] = userDoc.name;
                recentComments.push(comment);
            });
        });
        return res.status(200).json(recentComments);
    });

};


exports.getCommentsInfo = function(req, res) {
    var comments = [];
    var postId = req.params.id;
    postId = new ObjectID(postId);
    Interaction.aggregate({ "$unwind": "$comments" }, { "$match": { "comments.postId": postId } },
        function(err, aggrDocs) {
            if (err) { return response.handleError(res, err); }
            aggrDocs.forEach(function(aggDoc) {
                var comment = {};
                comment['name'] = aggDoc.name;
                comment['email'] = aggDoc.email;
                comment['mobile'] = aggDoc.mobile;
                comment['message'] = aggDoc.comments.message;
                comment['createdAt'] = aggDoc.comments.createdAt;
                comments.push(comment);
            });
            return res.status(200).json(comments);
        });
};