/**
 * @fileoverview This file contains a helper class for managing database connections.
 * @module server/src/helpers/dbHelper
 */

const mongoose = require('mongoose');
const { DB_URL } = require("../../config");

/**
 * @class dbHelper
 * @description A class to manage the database connection.
 */
class dbHelper {
    static #mongodb = DB_URL;

    /**
     * @description Creates a connection to the MongoDB database.
     * @returns {Promise<string>} A promise that resolves with a success message or rejects with an error.
     */
    createConnection() {
       return new Promise((resolve, reject) => {
            mongoose.connect(dbHelper.#mongodb).then(() => {
                resolve('db connection established');
            },
            (err) => {
                reject(new Error('not connected'));
                console.log('mongoose is not connected', err);
             }
            );
        });
    }
}

module.exports = new dbHelper();