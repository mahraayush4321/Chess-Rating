const express = require('express');
const router = express.Router();
const match = require('../../controllers/match');
const cron = require('../../helpers/cronJob')

router.post('/addMatch', match.saveMatch);
router.post('/save-game-history', match.saveGameHistory);
router.post('/update-ratings', cron.scheduleRatingUpdate);
router.get('/:id/stats', match.getPlayerStats);
router.get('/leaderboard', match.getLeaderBoard);
router.get('/getTopWinning', match.getTopWinningPlayers); 
router.get('/:userId/suitable-opponents', match.findSuitableOpponents);
router.get('/:id/history', match.getPlayerMatchHistory); 
router.post('/findMatch', match.findMatch);
router.post('/cancelMatch', match.cancelMatchSearch);
router.post('/acceptMatch', match.acceptMatch);

module.exports = router;