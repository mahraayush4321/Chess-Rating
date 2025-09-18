/**
 * @fileoverview This file contains a helper class for creating standardized HTTP responses.
 * @module server/src/helpers/response
 */

const Http_STATUS = require('./http-status');

/**
 * @class Response
 * @description A class to create standardized HTTP responses.
 */
class Response {
    /**
     * @description Creates a success response.
     * @param {object} res - Express response object.
     * @param {number} status - The HTTP status code.
     * @param {object} data - The data to be sent in the response.
     */
    createSucessResponse(res,status,data) {
        res.status(Http_STATUS.SUCCESS).json({
            status,
            data
        });
    }

    /**
     * @description Creates an internal server error response.
     * @param {object} res - Express response object.
     * @param {object} error - The error object.
     */
    createInternalErrorResponse(res, error) {
        res.status(Http_STATUS.INTERNAL_ERROR).json({
            status: 400,
            error:true,
            message: 'oops! something went wrong',
        });
    }
    
    /**
     * @description Creates a not found response.
     * @param {object} res - Express response object.
     * @param {string} [message] - A custom error message.
     */
    createNotFoundResponse(res,message) {
        const defaultMessage = 'Oops!,User not found.';
        res.status(Http_STATUS.NOTFOUND).json({
            status:404,
            error:true,
            message: message || defaultMessage
        });
    }

    /**
     * @description Creates an unauthorized response.
     * @param {object} res - Express response object.
     * @param {string} [message] - A custom error message.
     */
    createUnauthorizedResponse(res, message) {
        const defaultMessage = 'Password does not match, please fill the valid credentials';
        res.status(Http_STATUS.UNAUTHORIZED).json({
            status:401,
            error:true,
            message: message || defaultMessage
        });
    }

    /**
     * @description Creates a forbidden response.
     * @param {object} res - Express response object.
     * @param {string} [message] - A custom error message.
     */
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