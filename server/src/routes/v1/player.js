/**
 * @fileoverview This file defines the routes for player-related operations.
 * @module server/src/routes/v1/player
 */

const express = require('express');
const router = express.Router();
const player = require('../../controllers/player');

/**
 * @name GET /getPlayers
 * @description Route to get all players.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.get('/getPlayers', player.getAllPlayers);

/**
 * @name POST /addPlayer
 * @description Route to add a new player.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.post('/addPlayer', player.addPlayer);

/**
 * @name GET /searchPlayers
 * @description Route to search for players.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.get('/searchPlayers', player.searchPlayer);

/**
 * @name GET /getPlayer/:id
 * @description Route to get a single player.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.get('/getPlayer/:id', player.getPlayer);

/**
 * @name GET /player-rating/:id
 * @description Route to fetch a player's rating.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.get('/player-rating/:id', player.fetchPlayerRating);

/**
 * @name GET /gameHistory/:id
 * @description Route to get a player's game history.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.get('/gameHistory/:id', player.getPlayerMatchHistory);

/**
 * @name PATCH /updatePlayer/:id
 * @description Route to update a player's details.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.patch('/updatePlayer/:id', player.updatePlayer);

/**
 * @name GET /:id
 * @description Route to get a player by ID.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.get('/:id', player.getPlayerById);

/**
 * @name POST /follow
 * @description Route to follow a player.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.post('/follow', player.followPlayer);

/**
 * @name POST /unfollow
 * @description Route to unfollow a player.
 * @function
 * @memberof module:server/src/routes/v1/player
 * @inner
 */
router.post('/unfollow', player.unfollowPlayer);

module.exports = router;