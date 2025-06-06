const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    rating: {
      type: Number,
      default: 1200,
    },
    matches: [{
         type: mongoose.Schema.Types.ObjectId,
         ref: "Match"
    }],
    totalMatches: {
        type: Number,
        default: 0
    },
    wins: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    draws: {
        type: Number,
        default: 0
    },
    streak: {
      type: Number,
      default: 0,
    },
    age: {
       type: Number,
       min: 5, max: 100
    },
    country: { 
        type: String,
        default: 'Unknown'
    },
    bio: {
        type: String,
        maxlength: 300
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    isSearchingMatch: {
      type: Boolean,
      default: false
    },
    lastSearchStarted: {
      type: Date,
      default: null
    } 
  }
);

module.exports = mongoose.model("Player", playerSchema);
