/**
 * @fileoverview This file contains the Elo rating calculation algorithm.
 * @module server/src/helpers/ratingAlgorithms
 */

/**
 * @description Calculates the new Elo rating for a player.
 * @param {number} playerRating - The current rating of the player.
 * @param {number} opponentRating - The current rating of the opponent.
 * @param {number} score - The score of the match (1 for a win, 0.5 for a draw, 0 for a loss).
 * @param {number} [kFactor=32] - The K-factor, which determines how much the rating changes.
 * @returns {number} The new Elo rating.
 */
function calculateElo(playerRating, opponentRating, score, kFactor = 32) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return Math.round(playerRating + kFactor * (score - expectedScore));
}

module.exports = { calculateElo };
