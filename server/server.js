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
        origin: 'http://localhost:5173',
        credentials: true,
        methods: ["GET", "POST"]
    }
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