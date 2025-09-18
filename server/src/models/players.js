/**
 * @fileoverview This file defines the Mongoose schema for a player.
 * @module server/src/models/players
 */

const mongoose = require("mongoose");

/**
 * @description Mongoose schema for a player.
 * @property {mongoose.Schema.Types.ObjectId} _id - The ID of the player, which is the same as the user ID.
 * @property {string} name - The name of the player.
 * @property {mongoose.Schema.Types.ObjectId} userId - The ID of the user associated with this player.
 * @property {number} rating - The Elo rating of the player.
 * @property {Array<mongoose.Schema.Types.ObjectId>} matches - An array of match IDs that the player has participated in.
 * @property {number} totalMatches - The total number of matches played.
 * @property {number} wins - The total number of wins.
 * @property {number} losses - The total number of losses.
 * @property {number} draws - The total number of draws.
 * @property {number} streak - The current winning streak of the player.
 * @property {number} age - The age of the player.
 * @property {string} country - The country of the player.
 * @property {string} bio - A short biography of the player.
 * @property {Array<mongoose.Schema.Types.ObjectId>} followers - An array of player IDs who are following this player.
 * @property {Array<mongoose.Schema.Types.ObjectId>} following - An array of player IDs that this player is following.
 * @property {boolean} isSearchingMatch - A flag indicating if the player is currently searching for a match.
 * @property {Date} lastSearchStarted - The timestamp when the last match search was started.
 */
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
