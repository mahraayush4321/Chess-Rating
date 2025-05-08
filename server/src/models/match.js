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
    }
});

module.exports = mongoose.model('Match', matchSchema);
