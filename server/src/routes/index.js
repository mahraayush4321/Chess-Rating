const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

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