/**
 * @fileoverview This file dynamically loads all routes in the routes directory.
 * @module server/src/routes/index
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * @description Recursively loads all routes from a directory and its subdirectories.
 * @param {string} directory - The directory to load routes from.
 * @param {string} [additionalPath=''] - The additional path to prepend to the route.
 */
function loadRoutes(directory, additionalPath= '') {
    fs.readdirSync(directory).forEach((file) => {
        if(file === 'index.js') return;
        if(file && file.includes('.js')) {
            router.use(`${additionalPath}`, require(`./${additionalPath}/${file}`));
            console.log(`${additionalPath}/${file}`)
        }else{
            loadRoutes(path.join(directory,file), `${additionalPath}/${file}`);
        }
    });
}
loadRoutes(__dirname);
module.exports = router;