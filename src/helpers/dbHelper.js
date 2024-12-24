const mongoose = require('mongoose');
const { DB_URL } = require("../../config");

class dbHelper {
    static #mongodb = DB_URL;

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