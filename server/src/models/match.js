const mongoose = require('mongoose');

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

matchSchema.pre('save', function(next) {
    if (this.startTime && this.endTime) {
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    }
    next();
});

module.exports = mongoose.model('Match', matchSchema);
