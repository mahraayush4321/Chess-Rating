/**
 * @fileoverview This file defines constants used throughout the application.
 * @module server/src/helpers/constants
 */

/**
 * @class Constants
 * @description A class to hold application-wide constants.
 */
class Constants {
    /**
     * @description The prefix for all API routes.
     * @type {string}
     * @static
     */
    static get API_PREFIX() {
        return '/api';
    }
}
module.exports = Constants;