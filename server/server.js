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
            'https://chess-sh.netlify.app'
        ],
        credentials: true,
        methods: ["GET", "POST", "OPTIONS"]
    },
    pingTimeout: 60000, // Increase ping timeout
    pingInterval: 25000, // Increase ping interval
    transports: ['websocket', 'polling'], // Enable both WebSocket and polling
    allowEIO3: true // Enable Engine.IO v3 transport
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