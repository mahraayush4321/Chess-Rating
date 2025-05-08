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
            await Promise.all([p1.save(), p2.save()]);
            
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

     findSuitableOpponents = async (req, res) => {
        try {
            const { userId } = req.params;
            const currentPlayer = await Player.findById(userId);
            
            if (!currentPlayer) {
                return res.status(404).json({ error: 'Player not found' });
            }
    
            const currentRating = currentPlayer.rating;
            
            const suitableOpponents = await Player.find({
                _id: { $ne: userId },
                rating: { 
                    $gte: currentRating - 50,
                    $lte: currentRating + 100
                }
            }).select('name rating country');
    
            res.status(200).json({ 
                currentRating,
                suitableOpponents: suitableOpponents.map(opponent => ({
                    id: opponent._id,
                    name: opponent.name,
                    rating: opponent.rating,
                    country: opponent.country,
                    ratingDifference: Math.abs(opponent.rating - currentRating) 
                }))
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };    

    findMatch = async (req, res) => {
        try {
            const { playerId } = req.body;
            
            if (!playerId) {
                return res.status(400).json({ error: 'Player ID is required' });
            }

            const player = await Player.findById(playerId);
            
            if (!player) {
                return res.status(404).json({ error: 'Player not found' });
            }

            console.log(`Player ${player.name} searching for match`); // Add logging

            // Update player's searching status
            player.isSearchingMatch = true;
            player.lastSearchStarted = new Date();
            await player.save();

            // Find suitable opponent who is also searching
            const opponent = await Player.findOne({
                _id: { $ne: playerId },
                isSearchingMatch: true,
                rating: {
                    $gte: player.rating - 50,
                    $lte: player.rating + 100
                }
            }).sort({ lastSearchStarted: 1 });

            if (opponent) {
                console.log(`Match found between ${player.name} and ${opponent.name}`); // Add logging
                
                // Create match and update both players
                const match = new Match({
                    player1: playerId,
                    player2: opponent._id,
                    result: 'ongoing',
                    datePlayed: new Date(),
                    matchType: 'ranked'
                });
                await match.save();

                // Reset searching status for both players
                player.isSearchingMatch = false;
                opponent.isSearchingMatch = false;
                await Promise.all([player.save(), opponent.save()]);

                return res.status(200).json({
                    status: 'matched',
                    match,
                    opponent: {
                        id: opponent._id,
                        name: opponent.name,
                        rating: opponent.rating
                    }
                });
            }

            // No immediate match found
            return res.status(200).json({
                status: 'searching'
            });
        } catch (error) {
            console.error('Error in findMatch:', error); // Add logging
            res.status(500).json({ error: error.message });
        }
    };

    cancelMatchSearch = async (req, res) => {
        try {
            const { playerId } = req.body;
            
            if (!playerId) {
                return res.status(400).json({ error: 'Player ID is required' });
            }

            const player = await Player.findById(playerId);
            if (!player) {
                return res.status(404).json({ error: 'Player not found' });
            }

            player.isSearchingMatch = false;
            player.lastSearchStarted = null;
            await player.save();

            res.status(200).json({ message: 'Search cancelled' });
        } catch (error) {
            console.error('Error in cancelMatchSearch:', error); // Add logging
            res.status(500).json({ error: error.message });
        }
    };
    acceptMatch = async (req, res) => {
        try {
            const { matchId, playerId } = req.body;
            
            if (!matchId || !playerId) {
                return res.status(400).json({ error: 'Match ID and Player ID are required' });
            }

            const match = await Match.findById(matchId);
            if (!match) {
                return res.status(404).json({ error: 'Match not found' });
            }

            // Verify the player is part of this match
            if (match.player1.toString() !== playerId && match.player2.toString() !== playerId) {
                return res.status(403).json({ error: 'Player is not part of this match' });
            }

            // Update match status
            match.status = 'accepted';
            await match.save();

            // Get opponent details
            const opponentId = match.player1.toString() === playerId ? match.player2 : match.player1;
            const opponent = await Player.findById(opponentId);

            res.status(200).json({
                message: 'Match accepted',
                match,
                opponent: {
                    id: opponent._id,
                    name: opponent.name,
                    rating: opponent.rating
                }
            });
        } catch (error) {
            console.error('Error in acceptMatch:', error);
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = new Matchplayer();