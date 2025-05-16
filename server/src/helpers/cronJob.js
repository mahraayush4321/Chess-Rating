// const cron = require('node-cron');
// const playerModel = require('../models/players');
// const matchModel = require('../models/match');
// const { calculateElo } = require('../helpers/ratingAlgorithms');

// class CronJob {
//     constructor() {
//         this.scheduleRatingUpdate();
//     }

//     scheduleRatingUpdate() {
//         cron.schedule('* */10 * * *', async () => {
//             console.log('Running rating update cron job...');
//             try {
//                 const matches = await matchModel.find().sort({ datePlayed: -1 }).limit(100);
                
//                 const playerIds = [...new Set(
//                     matches.map(match => [match.player1.toString(), match.player2.toString()]).flat()
//                 )];

//                 const players = await playerModel.find({_id:{$in: playerIds }}).lean();

//                 const playerMap = players.reduce((acc, player) => {
//                     acc[player._id] = player;
//                     return acc;
//                 }, {});

//                 for (const match of matches) {
//                     const p1 = playerMap[match.player1.toString()];
//                     const p2 = playerMap[match.player2.toString()];

//                     if (!p1 || !p2) continue;

//                     const p1Score = match.result === 'win' ? 1 : match.result === 'draw' ? 0.5 : 0;
//                     const p2Score = 1 - p1Score;

//                     p1.rating = calculateElo(p1.rating, p2.rating, p1Score);
//                     p2.rating = calculateElo(p2.rating, p1.rating, p2Score);
//                 }

//                 const bulkUpdates = Object.values(playerMap).map(player => ({
//                     updateOne: {
//                         filter: { _id: player._id },
//                         update: { rating: player.rating, lastRatingUpdate: new Date() }
//                     }
//                 }));

//                 await playerModel.bulkWrite(bulkUpdates);

//                 console.log('Rating update complete!');
//             } catch (error) {
//                 console.error('Error during rating update:', error.message);
//             }
//         });
//     }
// }

// module.exports = new CronJob();
