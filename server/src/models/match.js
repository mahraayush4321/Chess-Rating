/**
 * @fileoverview This file defines the Mongoose schema for a match.
 * @module server/src/models/match
 */

const mongoose = require('mongoose');

/**
 * @description Mongoose schema for a match.
 * @property {mongoose.Schema.Types.ObjectId} player1 - The ID of the first player.
 * @property {mongoose.Schema.Types.ObjectId} player2 - The ID of the second player.
 * @property {string} result - The result of the match ('win', 'loss', 'draw', 'ongoing').
 * @property {Date} datePlayed - The date the match was played.
 * @property {string} matchType - The type of match ('ranked', 'casual').
 * @property {string} status - The status of the match ('pending', 'accepted', 'rejected', 'completed').
 * @property {number} timeControl - The time control for the match in seconds.
 * @property {number} duration - The duration of the match in seconds.
 * @property {Date} startTime - The start time of the match.
 * @property {Date} endTime - The end time of the match.
 * @property {Array<object>} moves - An array of moves made during the match.
 */
const matchSchema = new mongoose.Schema({
    player1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    player2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    result: {
        type: String,
        enum: ['win', 'loss', 'draw', 'ongoing'],
        required: true
    },
    datePlayed: {
        type: Date,
        required: true
    },
    matchType: {
        type: String,
        enum: ['ranked', 'casual'],
        default: 'ranked'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    timeControl: {
        type: Number,
        required: true,
        default: 300
    },
    duration: {
        type: Number,  
        default: 0
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    moves: [{
        timestamp: String,
        piece: String,
        from: String,
        to: String,
        player: String,
        capturedPiece: String,
        isCheck: Boolean,
        fen: String,
        timeRemaining: Number
    }]
});

/**
 * @description A pre-save hook to calculate the duration of the match.
 */
matchSchema.pre('save', function(next) {
    if (this.startTime && this.endTime) {
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    }
    next();
});

module.exports = mongoose.model('Match', matchSchema);
