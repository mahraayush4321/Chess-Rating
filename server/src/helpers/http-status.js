/**
 * @fileoverview This file defines a class containing common HTTP status codes.
 * @module server/src/helpers/http-status
 */

/**
 * @class HttpStatus
 * @description A class containing static getters for common HTTP status codes.
 */
class HttpStatus {
    
    /**
     * @description HTTP 200 OK.
     * @type {number}
     * @static
     */
    static get SUCCESS() {return 200; }

    /**
     * @description HTTP 201 Created.
     * @type {number}
     * @static
     */
    static get CREATED() {return 201; }

    /**
     * @description HTTP 401 Unauthorized.
     * @type {number}
     * @static
     */
    static get UNAUTHORIZED() {return 401; }

    /**
     * @description HTTP 404 Not Found.
     * @type {number}
     * @static
     */
    static get NOTFOUND() {return 404; }

    /**
     * @description HTTP 500 Internal Server Error.
     * @type {number}
     * @static
     */
    static get INTERNAL_ERROR() {return 500; }

    /**
     * @description HTTP 400 Bad Request.
     * @type {number}
     * @static
     */
    static get BAD_REQUEST() {return 400; }

    /**
     * @description HTTP 403 Forbidden.
     * @type {number}
     * @static
     */
    static get FORBIDDEN() {return 403; }
}

module.exports = HttpStatus;