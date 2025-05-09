import React, { useState, useEffect, useRef } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import io from 'socket.io-client';
import Board from "../../public/board.png"
import Header from '../components/Header';

const AddMatch = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [suitableOpponents, setSuitableOpponents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [matchStatus, setMatchStatus] = useState('idle'); // idle, searching, matched
  const [matchDetails, setMatchDetails] = useState(null);
  const [error, setError] = useState(null);
  const [playerReady, setPlayerReady] = useState(false); // Track if this player is ready
  const [waitingForOpponent, setWaitingForOpponent] = useState(false); // Track if waiting for opponent
  const [selectedTime, setSelectedTime] = useState(5);
  
  // Socket reference to prevent recreating on every render
  const socketRef = useRef(null);

  const setupSocket = () => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    } else if (!socketRef.current) {
      socketRef.current = io('https://chess-rating.onrender.com', {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
    }
  };

  const TimeOptions = () => (
    <div className="flex justify-center gap-4 mb-6">
      {[5, 10, 15].map(time => (
        <button
          key={time}
          onClick={() => setSelectedTime(time)}
          className={`px-4 py-2 rounded ${
            selectedTime === time 
              ? 'bg-purple-600 text-white' 
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {time} min
        </button>
      ))}
    </div>
  );

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        fetchSuitableOpponents(user._id);
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    }

    // Initialize socket connection
    setupSocket();

    // Add socket event listeners
    if (socketRef.current) {
      socketRef.current.on('connect', () => {
        console.log('Connected to matchmaking server');
      });

      socketRef.current.on('matchFound', (details) => {
        console.log('Match found:', details);
        setMatchDetails(details);
        setMatchStatus('matched');
        setIsSearching(false);
        
        // Include timeControl in the URL
        window.location.href = `/play?matchId=${details.matchId}&roomId=${details.roomId}&timeControl=${selectedTime * 60}`;
      });

      socketRef.current.on('matchmaking', (data) => {
        console.log('Matchmaking status:', data);
        setMatchStatus(data.status);
        if (data.status === 'searching') {
          setIsSearching(true);
        } else if (data.status === 'cancelled') {
          setIsSearching(false);
          setMatchStatus('idle');
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsSearching(false);
        setMatchStatus('idle');
      });
    }

    const reconnectInterval = setInterval(() => {
      if (!socketRef.current?.connected) {
        console.log('Attempting to reconnect...');
        setupSocket();
      }
    }, 5000);

    return () => {
      clearInterval(reconnectInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchSuitableOpponents = async (userId) => {
    try {
      const response = await fetch(`https://chess-rating.onrender.com/api/v1/findSuitableOpponents/${userId}`);
      const data = await response.json();
      
      if (data.suitableOpponents) {
        setSuitableOpponents(data.suitableOpponents);
      }
    } catch (err) {
      console.error("Failed to fetch opponents:", err);
    }
  };

  const findMatch = () => {
    if (!currentUser || !socketRef.current) return;
    
    setError(null); // Clear any previous errors
    
    // Emit findMatch event to server
    socketRef.current.emit('findMatch', { 
      playerId: currentUser._id,
      timeControl: selectedTime * 60
    });
    
    setIsSearching(true);
  };
  
  const cancelMatchSearch = () => {
    if (!socketRef.current) return;
    
    // Emit cancelMatchmaking event to server
    socketRef.current.emit('cancelMatchmaking');
    setIsSearching(false);
  };
  
  const startMatch = (opponent) => {
    setSelectedOpponent(opponent);
  };
  
  const confirmMatch = () => {
    // For direct challenges - not used in auto-matchmaking flow
    // You would implement this for the "Challenge" button functionality
    setSelectedOpponent(null);
  };

  // Handle the Start Game button click
  const handleStartGame = () => {
    if (matchDetails && socketRef.current && currentUser) {
      socketRef.current.emit('playerReady', {
        matchId: matchDetails.matchId,
        roomId: matchDetails.roomId,
        playerId: currentUser._id
      });
      
      // Update UI to show waiting for opponent
      setPlayerReady(true);
      setWaitingForOpponent(true);
    }
  };
  // const ChessBoard = () => {
  //   return (
  //     <div className="aspect-square bg-gradient-to-r from-green-800 to-green-900 rounded-lg overflow-hidden shadow-xl">
  //       <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
  //         {Array.from({ length: 64 }).map((_, index) => {
  //           const row = Math.floor(index / 8);
  //           const col = index % 8;
  //           const isLight = (row + col) % 2 === 0;
  //           return (
  //             <div 
  //               key={index} 
  //               className={`${isLight ? "bg-green-200" : "bg-green-600"}`}
  //             ></div>
  //           );
  //         })}
  //       </div>
  //     </div>
  //   );
  // };


  return (
<>
      <Header/>
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="mx-auto max-w-6xl p-4">
        {/* Main chess board and play options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-8">
          {/* <ChessBoard /> */}
          <img src={Board} alt="Chess Piece" />
          
          <div className="flex flex-col justify-center space-y-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-8">Play Chess Online</h1>
              <h2 className="text-3xl font-bold mb-6">on the #1 Site!</h2>
              <TimeOptions />
            </div>
            
            {/* Play buttons */}
            {matchStatus !== 'matched' ? (
              <button
                onClick={findMatch}
                disabled={isSearching}
                className="flex items-center justify-center py-6 px-6 rounded-lg bg-green-600 hover:bg-green-700 transition text-white text-xl font-bold"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Finding opponent...
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <div className="mr-3 bg-white rounded-full p-1">
                        <div className="w-8 h-8 bg-green-600 rounded-full"></div>
                      </div>
                      <div>
                        <div className="text-xl">Play Online</div>
                        <div className="text-sm text-green-200">Play with someone at your level</div>
                      </div>
                    </div>
                  </>
                )}
              </button>
            ) : null}
            
            {isSearching && (
              <button
                onClick={cancelMatchSearch}
                className="py-4 px-6 rounded-lg bg-red-600 hover:bg-red-700 transition text-white font-bold"
              >
                Cancel Search
              </button>
            )}
            
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Match Found Dialog */}
      {matchStatus === 'matched' && matchDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-6 w-96 max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Match Found!</h2>
            
            <div className="bg-green-900/30 border border-green-700 rounded p-4 mb-6">
              <p className="mb-2"><span className="font-semibold">Opponent:</span> {matchDetails.opponent.name}</p>
              <p className="mb-2"><span className="font-semibold">Rating:</span> {matchDetails.opponent.rating}</p>
              <p><span className="font-semibold">You are playing as:</span> {matchDetails.color}</p>
            </div>
            
            {playerReady ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                <span>Waiting for opponent...</span>
              </div>
            ) : (
              <button
                onClick={handleStartGame}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg text-white font-bold hover:from-green-700 hover:to-blue-700 transition"
              >
                Start Game
              </button>
            )}
            
            {!playerReady && (
              <button
                onClick={() => {setMatchStatus('idle'); setMatchDetails(null);}}
                className="w-full mt-3 py-2 bg-transparent border border-zinc-600 rounded-lg text-zinc-300 hover:bg-zinc-700 transition"
              >
                Decline Match
              </button>
            )}
          </div>
        </div>
      )}
    </div>
</>
  );
};

export default AddMatch;