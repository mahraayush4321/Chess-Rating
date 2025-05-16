const express = require('express');
const http = require('http');
const app = require('./app');
require('dotenv').config();
const { PORT } = require('./config');
const { Server } = require('socket.io');
const socketServer = require('./src/socket/matchmakingHandler');

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:5173',
            'https://chess-rating.onrender.com',
            'https://chess-rating.vercel.app',
            'https://chess-sh.netlify.app',
            'https://chess-analyzer-api-production.up.railway.app/api/analyze'
        ],
        credentials: true,
        methods: ["GET", "POST", "OPTIONS","PUT","DELETE"]
    },
    pingTimeout: 60000, 
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true
});


socketServer(io);

httpServer.listen(PORT, ()=> {
    console.log(`Server is listening to Port at ${PORT}`);
})

process.on("SIGTERM",shutDown);
process.on("SIGINT", shutDown);

function shutDown() {
    console.log("received signal to shutdown");
    httpServer.close(() => {
        console.log('closing');
        process.exit(0);
    });
};