
const Player = require('../models/players');
const Match = require('../models/match');
const { calculateElo } = require('../helpers/ratingAlgorithms');

const matchmakingQueue = new Map();

const readyPlayers = new Map();

const activeGames = new Map();

const initSocketHandlers = (io) => {
  console.log('Initializing socket handlers for matchmaking and chess game');

  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);
    let currentPlayerId = null;
    let heartbeat = null;

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

    
    socket.on('findMatch', async (data) => {
      try {
        const { playerId, timeControl } = data;  
        currentPlayerId = playerId;
      
        const player = await Player.findById(playerId);
        if (!player) {
          return socket.emit('matchError', { message: 'Player not found' });
        }
        
        console.log(`Player ${player.name} (${player.rating}) searching for match with time control: ${timeControl}s`);
        
        
        player.isSearchingMatch = true;
        player.lastSearchStarted = new Date();
        await player.save();
        
        matchmakingQueue.set(playerId, {
          socketId: socket.id,
          rating: player.rating,
          name: player.name || `${player.firstName} ${player.lastName}`,
          joinedAt: new Date(),
          timeControl: timeControl  
        });
        
     
        socket.emit('matchmaking', { status: 'searching' });
        
      
        findMatchForPlayer(socket, player);
      } catch (error) {
        console.error('Error in findMatch socket handler:', error);
        socket.emit('matchError', { message: error.message });
      }
    });

    
    socket.on('cancelMatchmaking', async () => {
      try {
        if (currentPlayerId) {
          
          const player = await Player.findById(currentPlayerId);
          if (player) {
            player.isSearchingMatch = false;
            await player.save();
          }
          
         
          matchmakingQueue.delete(currentPlayerId);
          socket.emit('matchmaking', { status: 'cancelled' });
          console.log(`Player ${currentPlayerId} cancelled matchmaking`);
        }
      } catch (error) {
        console.error('Error cancelling matchmaking:', error);
        socket.emit('matchError', { message: error.message });
      }
    });

    
    socket.on('chessMove', (data) => {
      console.log(`Chess move received in room ${data.roomId}:`, data);
      
      
      socket.to(data.roomId).emit('opponentMove', {
        from: data.from,
        to: data.to,
        promotion: data.promotion
      });
    });

    
    socket.on('matchResult', async (data) => {
      try {
        const { matchId, winner, loser, isDraw, roomId } = data;
        console.log(`Match result received for ${matchId}:`, data);
        
        const match = await Match.findById(matchId);
        
        if (!match) {
          return socket.emit('matchError', { message: 'Match not found' });
        }
        
        
        match.result = isDraw ? 'draw' : 'win';
        match.status = 'completed';
        match.endTime = new Date();
        await match.save();
        
       
        const player1 = await Player.findById(match.player1);
        const player2 = await Player.findById(match.player2);
        
        if (!player1 || !player2) {
          console.error('One or both players not found');
          return socket.emit('matchError', { message: 'Player(s) not found' });
        }
        
        
        let winnerId, loserId;
        if (!isDraw) {
          winnerId = winner;
          loserId = loser;
        }
        
        
        if (match.matchType === 'ranked') {
          try {
            
            const p1Score = isDraw ? 0.5 : (match.player1.toString() === winnerId ? 1 : 0);
            const p2Score = isDraw ? 0.5 : (match.player2.toString() === winnerId ? 1 : 0);
            
            
            player1.rating = calculateElo(player1.rating, player2.rating, p1Score);
            player2.rating = calculateElo(player2.rating, player1.rating, p2Score);
            
            
            player1.totalMatches += 1;
            player2.totalMatches += 1;
            
            if (isDraw) {
              player1.draws += 1;
              player2.draws += 1;
            } else if (match.player1.toString() === winnerId) {
              player1.wins += 1;
              player2.losses += 1;
            } else {
              player1.losses += 1;
              player2.wins += 1;
            }
            
            
            if (!player1.matches.includes(matchId)) {
              player1.matches.push(matchId);
            }
            if (!player2.matches.includes(matchId)) {
              player2.matches.push(matchId);
            }
            
            
            await Promise.all([player1.save(), player2.save()]);
            
            console.log(`Updated player stats for match ${matchId}`);
          } catch (ratingError) {
            console.error('Error updating player ratings:', ratingError);
          }
        }
        
       
        io.to(roomId).emit('matchEnded', {
          matchId,
          result: isDraw ? 'draw' : 'win',
          winner: isDraw ? null : winner,
          player1: {
            id: player1._id,
            name: player1.name,
            newRating: player1.rating
          },
          player2: {
            id: player2._id,
            name: player2.name,
            newRating: player2.rating
          }
        });
        
       
        if (activeGames.has(matchId)) {
          activeGames.delete(matchId);
        }
      } catch (error) {
        console.error('Error processing match result:', error);
        socket.emit('matchError', { message: error.message });
      }
    });

    
    socket.on('playerReady', async (data) => {
      const { matchId, roomId, playerId } = data;
      console.log(`Player ${playerId} ready for match ${matchId}`);
      
      
      if (!readyPlayers.has(matchId)) {
        readyPlayers.set(matchId, new Set());
      }
      
      
      const matchReadyPlayers = readyPlayers.get(matchId);
      matchReadyPlayers.add(playerId);
      
     
      if (matchReadyPlayers.size === 2) {
        const match = await Match.findById(matchId);
        if (match) {
          match.startTime = new Date();
          await match.save();
        }
        console.log(`Both players are ready for match ${matchId}, starting game`);
      
        io.to(roomId).emit('bothPlayersReady', {
          matchId,
          roomId
        });
        
       
        readyPlayers.delete(matchId);
        
        
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
      
        await socket.join(roomId);
        
      
        const match = await Match.findById(matchId);
        if (!match) {
          return socket.emit('matchError', { message: 'Match not found' });
        }
        
        
        const player = await Player.findById(playerId);
        const opponent = await Player.findById(
          match.player1.toString() === playerId ? match.player2 : match.player1
        );
        
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
    socket.on('recordMove', async (data) => {
      try {
        const { matchId, move } = data;
        
        
        const match = await Match.findById(matchId);
        if (!match) {
          return socket.emit('matchError', { message: 'Match not found' });
        }
        
        
        if (!match.moves) {
          match.moves = [];
        }
        match.moves.push(move);
        await match.save();
        
    
        socket.to(data.roomId).emit('moveRecorded', { move });
        
      } catch (error) {
        console.error('Error recording move:', error);
        socket.emit('matchError', { message: 'Failed to record move' });
      }
    });
  });
};


async function findMatchForPlayer(socket, player) {
  const playerId = player._id.toString();
  const playerRating = player.rating;
  
  console.log(`Attempting to find match for player ${player.name} (${playerRating})`);
  console.log(`Current queue size: ${matchmakingQueue.size}`);
  

  const potentialOpponents = [...matchmakingQueue.entries()]
    .filter(([id, data]) => {
  
      if (id === playerId) {
        console.log('Skipping self match');
        return false;
      }
      
  
      const ratingDiff = Math.abs(data.rating - playerRating);
      console.log(`Potential opponent ${data.name} (${data.rating}), rating diff: ${ratingDiff}`);
      return ratingDiff <= 100;
    })
    .sort((a, b) => a[1].joinedAt - b[1].joinedAt);

  console.log(`Found ${potentialOpponents.length} potential opponents`);


  if (potentialOpponents.length > 0) {
    const [opponentId, opponentData] = potentialOpponents[0];
    
    
    const opponentSocket = socket.server.sockets.sockets.get(opponentData.socketId);
    if (!opponentSocket) {
      console.log(`Opponent socket not found for ${opponentData.name}, removing from queue`);
      matchmakingQueue.delete(opponentId);
      return;
    }
    
   
    try {
      console.log(`Attempting to create match between ${player.name} and ${opponentData.name}`);
      
    
      matchmakingQueue.delete(playerId);
      matchmakingQueue.delete(opponentId);
      
     
      const [playerDoc, opponent] = await Promise.all([
        Player.findById(playerId),
        Player.findById(opponentId)
      ]);
      
      if (!playerDoc || !opponent) {
        console.log('Player or opponent not found in database');
        return socket.emit('matchError', { message: 'Player or opponent not found' });
      }
      
      const match = new Match({
        player1: playerId,
        player2: opponentId,
        result: 'ongoing',
        datePlayed: new Date(),
        matchType: 'ranked',
      });
      await match.save();
      
     
      playerDoc.matches.push(match._id);
      opponent.matches.push(match._id);
      
      
      playerDoc.isSearchingMatch = false;
      opponent.isSearchingMatch = false;
      await Promise.all([playerDoc.save(), opponent.save()]);
      
      const roomId = `match_${match._id}`;
      console.log(`Created match room: ${roomId}`);
      

      const player1Color = Math.random() > 0.5 ? 'white' : 'black';
      const player2Color = player1Color === 'white' ? 'black' : 'white';
      
      
      socket.emit('matchFound', {
        matchId: match._id.toString(),
        roomId,
        opponent: {
          id: opponentId,
          name: opponent.name || `${opponent.firstName} ${opponent.lastName}`,
          rating: opponent.rating
        },
        color: player1Color,
      });
      
      opponentSocket.emit('matchFound', {
        matchId: match._id.toString(),
        roomId,
        opponent: {
          id: playerId,
          name: playerDoc.name || `${playerDoc.firstName} ${playerDoc.lastName}`,
          rating: playerDoc.rating
        },
        color: player2Color,
      });
      
      
      await Promise.all([
        socket.join(roomId),
        opponentSocket.join(roomId)
      ]);
      
      console.log(`Successfully created match between ${playerDoc.name} and ${opponent.name}`);
    } catch (error) {
      console.error('Error creating match:', error);
      
      matchmakingQueue.set(playerId, {
        socketId: socket.id,
        rating: playerRating,
        name: player.name,
        joinedAt: new Date(),
      });
      matchmakingQueue.set(opponentId, opponentData);
      socket.emit('matchError', { message: 'Failed to create match, retrying...' });
    }
  } else {
    console.log(`No suitable opponents found for ${player.name} (${playerRating})`);
  }
}


module.exports = initSocketHandlers;