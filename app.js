const express = require('express');
const mongoose = require('mongoose');
const dbHelper = require('./src/helpers/dbHelper');
const CONST = require('./src/helpers/constants');
const loadRoutes = require('./src/routes')
const cronJob = require('./src/helpers/cronJob');
const app = express();

require('dotenv').config();
app.use(express.json());

dbHelper.createConnection().then(()=>{
    console.log('db connected successfully')
}).catch((err)=>{
    console.log('failed to connect to db',err);
})

cronJob.scheduleRatingUpdate();

app.use(CONST.API_PREFIX, loadRoutes)

module.exports = app
