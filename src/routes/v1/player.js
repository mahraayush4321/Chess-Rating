const express = require('express');
const router = express.Router();
const player = require('../../controllers/player');


router.get('/getPlayers', player.getAllPlayers);
router.post('/addPlayer', player.addPlayer);
router.get('/:id/player-rating',player.fetchPlayerRating)
router.get('/:id/getPlayer', player.getPlayer)
router.patch('/:id',player.updatePlayer)
router.get('/searchPlayers', player.searchPlayer);
router.get('/:id/gameHistory', player.getPlayerMatchHistory);
router.post('/follow', player.followPlayer);
router.post('/unfollow', player.unfollowPlayer);
module.exports = router;