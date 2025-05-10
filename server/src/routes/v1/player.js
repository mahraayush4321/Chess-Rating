const express = require('express');
const router = express.Router();
const player = require('../../controllers/player');

router.get('/getPlayers', player.getAllPlayers);
router.post('/addPlayer', player.addPlayer);
router.get('/searchPlayers', player.searchPlayer);
router.get('/getPlayer/:id', player.getPlayer);
router.get('/player-rating/:id', player.fetchPlayerRating);
router.get('/gameHistory/:id', player.getPlayerMatchHistory);
router.patch('/updatePlayer/:id', player.updatePlayer);
router.get('/:id', player.getPlayerById);
router.post('/follow', player.followPlayer);
router.post('/unfollow', player.unfollowPlayer);

module.exports = router;