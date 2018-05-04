'use strict';

exports.handleSuccess = function (res, result, successCode) {
    successCode = successCode || 200;
    var response = { 'success': true };
    if (result) {
        response.result = result;
        response.count = result.length || 0;
    }
    return res.status(successCode).json(response);
};

exports.handleError = function (res, err, errCode) {
    errCode = errCode || 500;
    return res.status(errCode).json({ 'error': err, 'errorCode': errCode });
};
