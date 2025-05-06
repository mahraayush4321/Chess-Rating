const Http_STATUS = require('./http-status');
class Response {
    createSucessResponse(res,status,data) {
        res.status(Http_STATUS.SUCCESS).json({
            status,
            data
        });
    }

    createInternalErrorResponse(res, error) {
        res.status(Http_STATUS.INTERNAL_ERROR).json({
            status: 400,
            error:true,
            message: 'oops! something went wrong',
        });
    }
    
    createNotFoundResponse(res,message) {
        const defaultMessage = 'Oops!,User not found.';
        res.status(Http_STATUS.NOTFOUND).json({
            status:404,
            error:true,
            message: message || defaultMessage
        });
    }

    createUnauthorizedResponse(res, message) {
        const defaultMessage = 'Password does not match, please fill the valid credentials';
        res.status(Http_STATUS.UNAUTHORIZED).json({
            status:401,
            error:true,
            message: message || defaultMessage
        });
    }

    createForbiddenResponse(res,message) {
        const defaultMessage = 'You are not authorized to update this post';
        res.status(Http_STATUS.FORBIDDEN).json({
            status:403,
            error:true,
            message: message ||  defaultMessage
        });
    }
};

module.exports = new Response();