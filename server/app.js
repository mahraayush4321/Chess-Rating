const express = require('express');
const mongoose = require('mongoose');
const dbHelper = require('./src/helpers/dbHelper');
const CONST = require('./src/helpers/constants');
const loadRoutes = require('./src/routes')
// const cronJob = require('./src/helpers/cronJob');
const app = express();
const cors = require('cors');

const corsOpt = {
    origin: ['http://localhost:5173', 'https://chess-rating.onrender.com', 'https://chess-rating.vercel.app','https://chess-sh.netlify.app','https://chess-analyzer-api-production.up.railway.app/api/analyze'],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "PATCH"],
};

app.use(cors(corsOpt));
app.options('*', cors(corsOpt));

require('dotenv').config();
app.use(express.json());

dbHelper.createConnection().then(()=>{
    console.log('db connected successfully')
}).catch((err)=>{
    console.log('failed to connect to db',err);
});

// cronJob.scheduleRatingUpdate();

app.use(CONST.API_PREFIX, loadRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

module.exports = app;
