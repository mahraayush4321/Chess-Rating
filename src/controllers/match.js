const Match = require('../models/match');
const Player = require('../models/players');
const { calculateElo } = require('../helpers/ratingAlgorithms');

class Matchplayer {  
    saveMatch = async (req,res) => {
        try {
            const { player1, player2, result, datePlayed } = req.body;

            const matchDate = datePlayed ? new Date(datePlayed) : new Date();
    
            const p1 = await Player.findById(player1);
            const p2 = await Player.findById(player2);
    
            if (!p1 || !p2) return res.status(404).json({ error: 'Player(s) not found' });
    
            const p1Score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
            const p2Score = 1 - p1Score;

            p1.rating = calculateElo(p1.rating, p2.rating, p1Score);
            p2.rating = calculateElo(p2.rating, p1.rating, p2Score);

            p1.totalMatches += 1;
            p2.totalMatches += 1;
    
            await p1.save();
            await p2.save();
    
            const match = new Match({ player1, player2, result,  datePlayed: matchDate });
            await match.save();

            p1.matches.push(match._id);
            p2.matches.push(match._id);

            await p1.save();
            await p2.save();
            
            res.status(201).json({ message: 'Match saved', match });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    saveGameHistory = async (req,res) => {
        try {
            const { player1, player2, datePlayed, result } = req.body;

            if (!player1 || !player2 || !datePlayed) {
                return res.status(400).json({ error: 'Player names and date are required.' });
            }

            const parsedDate = new Date(datePlayed);
            if (isNaN(parsedDate)) {
                return res.status(400).json({ error: 'Invalid date format.' });
            }

            const match = new Match({
                player1,
                player2,
                datePlayed: parsedDate,
                result: result || 'draw',
            });

            await match.save();

            res.status(201).json({ message: 'Game history saved successfully.', match });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error.' });
        }
    };

    getPlayerStats = async (req, res) => {
        try {
            const { id } = req.params;
            const player = await Player.findById(id).populate('matches'); 
    
            if (!player) {
                return res.status(404).json({ error: 'Player not found' });
            }
    
            const totalMatches = player.matches.length;
            const wins = player.matches.filter(match => match.result === 'win').length;
            const losses = player.matches.filter(match => match.result === 'loss').length;
            const draws = player.matches.filter(match => match.result === 'draw').length;
            const averageRating = player.rating;
    
            res.status(200).json({ totalMatches, wins, losses, draws, averageRating });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    getLeaderBoard = async (req,res) => {
        try {
            const { page= 1, limit = 10} = req.query;
            const players = await Player.find().sort({rating:-1}).skip((page-1)*limit).limit(Number(limit));
            res.status(200).json({ leaderboard: players });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    getTopWinningPlayers = async (req,res) => {
        try {
            const players = await Player.find();
             let streaks = [];

             for(const player of players){
                let winStreak = 0;
                let lossStreak = 0;
                let longestWinStreak = 0;
                let longestLossStreak = 0;
                const matches = await Match.find({
                    $or:[{player1: player._id}, {player2: player._id}]
                }).sort({datePlayed:-1});

                matches.forEach((match,idx)=> {
                    if (match.result === 'win') {
                        winStreak++; 
                        lossStreak = 0;  
                    } else if (match.result === 'loss') {
                        lossStreak++; 
                        winStreak = 0;
                    } else {
                        winStreak = 0;
                        lossStreak = 0;
                    }
                })

                longestWinStreak = Math.max(longestWinStreak, winStreak);
                longestLossStreak = Math.max(longestLossStreak, lossStreak);

                streaks.push({name:player.name,longestWinStreak, longestLossStreak})
             }
             streaks.sort((a, b) => b.longestWinStreak - a.longestWinStreak || b.longestLossStreak - a.longestLossStreak);
             res.status(200).json({ players: streaks });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    suggestOpponents = async (req, res) => {
        try {
            const { id } = req.params;
            const range = Number(req.query.range) || 1000;
    
            const player = await Player.findById(id);
            if (!player) {
                return res.status(404).json({ message: 'Player not found' });
            }
            const opponents = await Player.find({
                _id: { $ne: id },
                rating: { $gte: player.rating - range, $lte: player.rating + range },
            }).select('name rating');
    
            res.status(200).json({ suggestedOpponents: opponents });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}


module.exports = new Matchplayer();
