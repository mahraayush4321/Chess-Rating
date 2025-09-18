/**
 * @fileoverview This file loads environment variables from a .env file
 * and exports them as a configuration object.
 * @module server/config
 */

const dotenv = require('dotenv');
dotenv.config();

/**
 * @description The configuration object containing environment variables.
 * @property {string} PORT - The port on which the server will run.
 * @property {string} DB_URL - The connection URL for the MongoDB database.
 * @property {string} JWT_SECRET - The secret key for signing JSON Web Tokens.
 */
module.exports = {
    PORT: process.env.PORT,
    DB_URL: process.env.DB_URL,
    JWT_SECRET: process.env.JWT_SECRET
}