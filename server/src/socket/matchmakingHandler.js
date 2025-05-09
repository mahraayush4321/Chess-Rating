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
    let heartbeat = null;

    // Setup heartbeat
    heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      } else {
        clearInterval(heartbeat);
      }
    }, 25000);

    socket.on('disconnect', async (reason) => {
      console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
      clearInterval(heartbeat);
      
      if (currentPlayerId) {
        try {
          const player = await Player.findById(currentPlayerId);
          if (player) {
            player.isSearchingMatch = false;
            await player.save();
          }
          matchmakingQueue.delete(currentPlayerId);
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });

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
    socket.on('joinMatch', async (data) => {
      const { matchId, roomId, playerId } = data;
      console.log(`Player ${playerId} joining match ${matchId} in room ${roomId}`);
      
      try {
        // Join the room
        await socket.join(roomId);
        
        // Find the match
        const match = await Match.findById(matchId);
        if (!match) {
          return socket.emit('matchError', { message: 'Match not found' });
        }
        
        // Get player details
        const player = await Player.findById(playerId);
        const opponent = await Player.findById(
          match.player1.toString() === playerId ? match.player2 : match.player1
        );
        
        // Send match details to the player
        socket.emit('matchFound', {
          matchId,
          roomId,
          color: match.player1.toString() === playerId ? 'white' : 'black',
          opponent: {
            id: opponent._id,
            name: opponent.name,
            rating: opponent.rating
          }
        });
        
        console.log(`Player ${player.name} successfully joined match ${matchId}`);
      } catch (error) {
        console.error('Error joining match:', error);
        socket.emit('matchError', { message: 'Failed to join match' });
      }
    });
  });
};

// Function to find match for a player
async function findMatchForPlayer(socket, player) {
  const playerId = player._id.toString();
  const playerRating = player.rating;
  
  console.log(`Attempting to find match for player ${player.name} (${playerRating})`);
  console.log(`Current queue size: ${matchmakingQueue.size}`);
  
  // Find potential opponents within rating range
  const potentialOpponents = [...matchmakingQueue.entries()]
    .filter(([id, data]) => {
      // Skip self
      if (id === playerId) {
        console.log('Skipping self match');
        return false;
      }
      
      // Check rating range (within -50 to +100 of player's rating)
      const ratingDiff = Math.abs(data.rating - playerRating);
      console.log(`Potential opponent ${data.name} (${data.rating}), rating diff: ${ratingDiff}`);
      return ratingDiff <= 100;
    })
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  console.log(`Found ${potentialOpponents.length} potential opponents`);

  // If we found a match
  if (potentialOpponents.length > 0) {
    const [opponentId, opponentData] = potentialOpponents[0];
    
    // Get opponent socket
    const opponentSocket = socket.server.sockets.sockets.get(opponentData.socketId);
    if (!opponentSocket) {
      console.log(`Opponent socket not found for ${opponentData.name}, removing from queue`);
      matchmakingQueue.delete(opponentId);
      return;
    }
    
    // Inside findMatchForPlayer function, in the try block after creating match
    try {
      console.log(`Attempting to create match between ${player.name} and ${opponentData.name}`);
      
      // Remove both players from queue FIRST to prevent double matching
      matchmakingQueue.delete(playerId);
      matchmakingQueue.delete(opponentId);
      
      // Update player statuses in database
      const [playerDoc, opponent] = await Promise.all([
        Player.findById(playerId),
        Player.findById(opponentId)
      ]);
      
      if (!playerDoc || !opponent) {
        console.log('Player or opponent not found in database');
        return socket.emit('matchError', { message: 'Player or opponent not found' });
      }
      
      // Create new match in database
      const match = new Match({
        player1: playerId,
        player2: opponentId,
        result: 'ongoing',
        datePlayed: new Date(),
        matchType: 'ranked'
      });
      await match.save();
      
      const roomId = `match_${match._id}`;
      console.log(`Created match room: ${roomId}`);
      
      // Join both players to room
      await Promise.all([
        socket.join(roomId),
        opponentSocket.join(roomId)
      ]);
      
      // Determine colors before setTimeout
      const player1Color = Math.random() > 0.5 ? 'white' : 'black';
      const player2Color = player1Color === 'white' ? 'black' : 'white';
      
      // Prepare match data with additional fields
      const matchData = {
        matchId: match._id.toString(),
        roomId,
        status: 'created'
      };
      
      // Notify first player with delay
      setTimeout(() => {
        socket.emit('matchFound', {
          ...matchData,
          opponent: {
            id: opponentId,
            name: opponent.name || `${opponent.firstName} ${opponent.lastName}`,
            rating: opponent.rating
          },
          color: player1Color
        });
      }, 500);
      
      // Notify second player with delay
      setTimeout(() => {
        opponentSocket.emit('matchFound', {
          ...matchData,
          opponent: {
            id: playerId,
            name: playerDoc.name || `${playerDoc.firstName} ${playerDoc.lastName}`,
            rating: playerDoc.rating
          },
          color: player2Color
        });
      }, 500);
      
      console.log(`Successfully created match between ${playerDoc.name} and ${opponent.name}`);
    } catch (error) {
      console.error('Error creating match:', error);
      // Put players back in queue if match creation fails
      matchmakingQueue.set(playerId, {
        socketId: socket.id,
        rating: playerRating,
        name: player.name,
        joinedAt: new Date()
      });
      matchmakingQueue.set(opponentId, opponentData);
      socket.emit('matchError', { message: 'Failed to create match, retrying...' });
    }
  } else {
    console.log(`No suitable opponents found for ${player.name} (${playerRating})`);
  }
}

// Move joinMatch handler inside connection scope


module.exports = initSocketHandlers;