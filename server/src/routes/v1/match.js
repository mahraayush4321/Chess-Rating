/**
 * @fileoverview This file defines the routes for match-related operations.
 * @module server/src/routes/v1/match
 */

const express = require('express');
const router = express.Router();
const match = require('../../controllers/match');
const cron = require('../../helpers/cronJob')

/**
 * @name POST /addMatch
 * @description Route to add a new match.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.post('/addMatch', match.saveMatch);

/**
 * @name POST /save-game-history
 * @description Route to save a game history.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.post('/save-game-history', match.saveGameHistory);

/**
 * @name GET /:id/stats
 * @description Route to get player statistics.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.get('/:id/stats', match.getPlayerStats);

/**
 * @name GET /leaderboard
 * @description Route to get the leaderboard.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.get('/leaderboard', match.getLeaderBoard);

/**
 * @name GET /getTopWinning
 * @description Route to get the top winning players.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.get('/getTopWinning', match.getTopWinningPlayers); 

/**
 * @name GET /:userId/suitable-opponents
 * @description Route to find suitable opponents for a player.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.get('/:userId/suitable-opponents', match.findSuitableOpponents);

/**
 * @name GET /:id/history
 * @description Route to get a player's match history.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.get('/:id/history', match.getPlayerMatchHistory); 

/**
 * @name POST /findMatch
 * @description Route to find a match for a player.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.post('/findMatch', match.findMatch);

/**
 * @name POST /cancelMatch
 * @description Route to cancel a match search.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.post('/cancelMatch', match.cancelMatchSearch);

/**
 * @name POST /acceptMatch
 * @description Route to accept a match.
 * @function
 * @memberof module:server/src/routes/v1/match
 * @inner
 */
router.post('/acceptMatch', match.acceptMatch);

module.exports = router;