const mongoose = require('mongoose');
const result = ['win', 'loss', 'draw']
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
       enum:result, 
       required: true 
    },
    datePlayed: {
      type: Date,
      required: true 
   },
   matchType: {
      type: String,
      enum: ['practice', 'ranked', 'tournament'],
      required: true
  }  
},{timestamps:{createdAt: 'createdAt', updatedAt: 'lastUpdatedAt'},versionKey:false});

module.exports = mongoose.model('Match', matchSchema);
