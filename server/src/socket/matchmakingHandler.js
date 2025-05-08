// src/socket/matchmakingHandler.js
const Player = require('../models/players');
const Match = require('../models/match');

// Store active players looking for matches
const matchmakingQueue = new Map();

// Store ready status for matches
const readyPlayers = new Map();

// Store active games
const activeGames = new Map();

const initSocketHandlers = (io) => {
  console.log('Initializing socket handlers for matchmaking and chess game');

  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);
    let currentPlayerId = null;

    // Handle find match requests
    socket.on('findMatch', async (data) => {
      try {
        const { playerId } = data;
        currentPlayerId = playerId;
        
        // Find player in database
        const player = await Player.findById(playerId);
        if (!player) {
          return socket.emit('matchError', { message: 'Player not found' });
        }
        
        console.log(`Player ${player.name} (${player.rating}) searching for match`);
        
        // Update player status in database
        player.isSearchingMatch = true;
        player.lastSearchStarted = new Date();
        await player.save();
        
        // Add player to matchmaking queue with rating info
        matchmakingQueue.set(playerId, {
          socketId: socket.id,
          rating: player.rating,
          name: player.name || `${player.firstName} ${player.lastName}`,
          joinedAt: new Date()
        });
        
        // Notify player they're in queue
        socket.emit('matchmaking', { status: 'searching' });
        
        // Try to find a match
        findMatchForPlayer(socket, player);
      } catch (error) {
        console.error('Error in findMatch socket handler:', error);
        socket.emit('matchError', { message: error.message });
      }
    });

    // Handle cancellation of matchmaking
    socket.on('cancelMatchmaking', async () => {
      try {
        if (currentPlayerId) {
          // Update player in database
          const player = await Player.findById(currentPlayerId);
          if (player) {
            player.isSearchingMatch = false;
            await player.save();
          }
          
          // Remove from queue
          matchmakingQueue.delete(currentPlayerId);
          socket.emit('matchmaking', { status: 'cancelled' });
          console.log(`Player ${currentPlayerId} cancelled matchmaking`);
        }
      } catch (error) {
        console.error('Error cancelling matchmaking:', error);
        socket.emit('matchError', { message: error.message });
      }
    });

    // Handle chess moves
    socket.on('chessMove', (data) => {
      console.log(`Chess move received in room ${data.roomId}:`, data);
      
      // Forward the move to the opponent in the same room
      socket.to(data.roomId).emit('opponentMove', {
        from: data.from,
        to: data.to,
        promotion: data.promotion
      });
    });

    // Handle match result
    socket.on('matchResult', async (data) => {
      try {
        const { matchId, winner, loser, isDraw } = data;
        console.log(`Match result received for ${matchId}:`, data);
        
        const match = await Match.findById(matchId);
        
        if (!match) {
          return socket.emit('matchError', { message: 'Match not found' });
        }
        
        // Update match result
        match.result = isDraw ? 'draw' : 'win';
        match.winner = isDraw ? null : winner;
        match.endDate = new Date();
        await match.save();
        
        // Update player ratings if this was a ranked match
        if (match.matchType === 'ranked' && !isDraw) {
          try {
            // Get both players
            const winnerPlayer = await Player.findById(winner);
            const loserPlayer = await Player.findById(loser);
            
            if (winnerPlayer && loserPlayer) {
              // Calculate ELO change (simple version)
              const expectedScore = 1 / (1 + Math.pow(10, (loserPlayer.rating - winnerPlayer.rating) / 400));
              const kFactor = 32; // Standard K-factor
              const ratingChange = Math.round(kFactor * (1 - expectedScore));
              
              // Update ratings
              winnerPlayer.rating += ratingChange;
              loserPlayer.rating -= ratingChange;
              
              // Update match history counts
              winnerPlayer.matchesWon += 1;
              loserPlayer.matchesLost += 1;
              
              // Save changes
              await Promise.all([winnerPlayer.save(), loserPlayer.save()]);
              
              console.log(`Updated ratings: Winner ${winner} +${ratingChange}, Loser ${loser} -${ratingChange}`);
            }
          } catch (ratingError) {
            console.error('Error updating player ratings:', ratingError);
            // Continue even if rating update fails
          }
        }
        
        // Emit result to both players in the room
        io.to(data.roomId).emit('matchEnded', {
          matchId,
          result: isDraw ? 'draw' : 'win',
          winner: isDraw ? null : winner
        });
        
        // Clean up active game data
        if (activeGames.has(matchId)) {
          activeGames.delete(matchId);
        }
      } catch (error) {
        console.error('Error processing match result:', error);
        socket.emit('matchError', { message: error.message });
      }
    });

    // Handle player ready status
    socket.on('playerReady', (data) => {
      const { matchId, roomId, playerId } = data;
      console.log(`Player ${playerId} ready for match ${matchId}`);
      
      // Initialize ready players for this match if not exists
      if (!readyPlayers.has(matchId)) {
        readyPlayers.set(matchId, new Set());
      }
      
      // Add this player to ready set
      const matchReadyPlayers = readyPlayers.get(matchId);
      matchReadyPlayers.add(playerId);
      
      // Check if both players are ready
      if (matchReadyPlayers.size === 2) {
        console.log(`Both players are ready for match ${matchId}, starting game`);
        
        // Both players are ready, emit event to start the game
        io.to(roomId).emit('bothPlayersReady', {
          matchId,
          roomId
        });
        
        // Clean up ready players for this match
        readyPlayers.delete(matchId);
        
        // Initialize game state
        activeGames.set(matchId, {
          roomId,
          startTime: new Date(),
          status: 'active'
        });
      }
    });

    // Handle disconnections
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // If player was searching, update their status
      if (currentPlayerId) {
        try {
          const player = await Player.findById(currentPlayerId);
          if (player) {
            player.isSearchingMatch = false;
            await player.save();
          }
          
          // Remove from queue
          matchmakingQueue.delete(currentPlayerId);
          
          // Check if player was in any active match
          // This would require keeping track of player-to-match mapping
          // For simplicity, we're not implementing automatic forfeit on disconnect
          // But in a real application, you might want to handle this case
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });
};

// Function to find match for a player
async function findMatchForPlayer(socket, player) {
  const playerId = player._id.toString();
  const playerRating = player.rating;
  
  // Find potential opponents within rating range
  const potentialOpponents = [...matchmakingQueue.entries()]
    .filter(([id, data]) => {
      // Skip self
      if (id === playerId) return false;
      
      // Check rating range (within -50 to +100 of player's rating)
      const ratingDiff = Math.abs(data.rating - playerRating);
      return ratingDiff <= 100;
    })
    // Sort by time in queue (first in, first matched)
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  // If we found a match
  if (potentialOpponents.length > 0) {
    const [opponentId, opponentData] = potentialOpponents[0];
    
    // Get opponent socket
    const opponentSocket = socket.server.sockets.sockets.get(opponentData.socketId);
    if (!opponentSocket) {
      // Opponent socket not found, remove from queue
      matchmakingQueue.delete(opponentId);
      return;
    }
    
    try {
      // Remove both players from queue
      matchmakingQueue.delete(playerId);
      matchmakingQueue.delete(opponentId);
      
      // Update player statuses in database
      const [playerDoc, opponent] = await Promise.all([
        Player.findById(playerId),
        Player.findById(opponentId)
      ]);
      
      if (!playerDoc || !opponent) {
        return socket.emit('matchError', { message: 'Player or opponent not found' });
      }
      
      // Reset searching status
      playerDoc.isSearchingMatch = false;
      opponent.isSearchingMatch = false;
      await Promise.all([playerDoc.save(), opponent.save()]);
      
      // Create new match in database
      const match = new Match({
        player1: playerId,
        player2: opponentId,
        result: 'ongoing',
        datePlayed: new Date(),
        matchType: 'ranked'
      });
      await match.save();
      
      // Create unique room for this match
      const roomId = `match_${match._id}`;
      
      // Join both players to room
      socket.join(roomId);
      opponentSocket.join(roomId);
      
      // Determine colors (randomly)
      const player1Color = Math.random() > 0.5 ? 'white' : 'black';
      const player2Color = player1Color === 'white' ? 'black' : 'white';
      
      // Notify first player
      socket.emit('matchFound', {
        matchId: match._id.toString(),
        roomId,
        opponent: {
          id: opponentId, 
          name: opponent.name || `${opponent.firstName} ${opponent.lastName}`,
          rating: opponent.rating
        },
        color: player1Color
      });
      
      // Notify second player
      opponentSocket.emit('matchFound', {
        matchId: match._id.toString(),
        roomId,
        opponent: {
          id: playerId,
          name: playerDoc.name || `${playerDoc.firstName} ${playerDoc.lastName}`,
          rating: playerDoc.rating
        },
        color: player2Color
      });
      
      console.log(`Match created: ${match._id}, Player1: ${playerDoc.name || playerDoc.firstName} vs Player2: ${opponent.name || opponent.firstName}`);
    } catch (error) {
      console.error('Error creating match:', error);
      socket.emit('matchError', { message: 'Failed to create match' });
    }
  }
}

module.exports = initSocketHandlers;