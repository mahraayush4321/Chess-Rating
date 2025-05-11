import React, { useState, useEffect, useRef } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card";
import io from 'socket.io-client';
import Board from "../../public/board.png"
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();


  
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

        const searchParams = new URLSearchParams();
        searchParams.set('matchId', details.matchId);
        searchParams.set('roomId', details.roomId);
        searchParams.set('timeControl', details.timeControl || selectedTime * 60)
        
        // Include timeControl in the URL
        navigate(`/play?matchId=${details.matchId}&roomId=${details.roomId}&timeControl=${selectedTime * 60}`);
      });

      socketRef.current.on("matchmaking", (data) => {
        console.log("Matchmaking status:", data);
        setMatchStatus(data.status);
        if (data.status === "searching") {
          setIsSearching(true);
        } else if (data.status === "cancelled") {
          setIsSearching(false);
          setMatchStatus("idle");
        }
      });

      ('matchEnded', (data) => {
        console.log('Match ended with data:', data);
        
        // If we want to update the UI with the match result
        if (currentUser) {
          // Refresh player data to get updated matches
          fetchPlayerData(currentUser._id);
        }
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

  const fetchPlayerData = async (userId) => {
    try {
      const response = await fetch(`https://chess-rating.onrender.com/api/v1/${userId}`);
      const data = await response.json();
      
      if (data) {
        // Update local storage with fresh player data
        localStorage.setItem('user', JSON.stringify(data));
        setCurrentUser(data);
        
        // Log to verify matches are populated
        console.log('Updated player data:', data);
        console.log('Player matches:', data.matches ? data.matches.length : 0);
      }
    } catch (err) {
      console.error("Failed to fetch player data:", err);
    }
  };

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

  return (
  <>
    <Header />
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Main chess board and play options */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-8 md:py-12">
          {/* Chess Board - Responsive sizing */}
          <div className="w-full max-w-md lg:max-w-2xl">
            <img 
              src={Board} 
              alt="Chess Board" 
              className="w-full mt-10 rounded-lg shadow-xl border border-zinc-700"
            />
          </div>
          
          {/* Play Options */}
          <div className="w-full max-w-md flex flex-col space-y-6 md:space-y-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Play Chess Online
              </h1>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-300">
                on the #1 Chess Site!
              </h2>
            </div>
            
            <TimeOptions />
            
            {/* Play buttons */}
            {matchStatus !== 'matched' ? (
              <button
                onClick={findMatch}
                disabled={isSearching}
                className={`relative overflow-hidden flex items-center justify-center py-4 px-6 rounded-xl text-white font-bold transition-all
                  ${isSearching 
                    ? 'bg-zinc-700 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-green-500/20'}
                `}
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Finding opponent...</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center w-full justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 bg-white rounded-full p-1">
                          <div className="w-6 h-6 bg-green-600 rounded-full"></div>
                        </div>
                        <div className="text-left">
                          <div className="text-lg md:text-xl">Play Online</div>
                          <div className="text-xs md:text-sm text-green-200/80">Play with someone at your level</div>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </>
                )}
              </button>
            ) : null}
            
            {isSearching && (
              <button
                onClick={cancelMatchSearch}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 transition text-white font-medium shadow-lg hover:shadow-red-500/10"
              >
                Cancel Search
              </button>
            )}
            
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-center backdrop-blur-sm animate-pulse">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Match Found Dialog */}
      {matchStatus === 'matched' && matchDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-6 w-full max-w-md animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-center text-transparent bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text">
              Match Found!
            </h2>
            
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-700/50 rounded-lg p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-zinc-300">Opponent:</span>
                <span className="font-semibold">{matchDetails.opponent.name}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-zinc-300">Rating:</span>
                <span className="font-semibold">{matchDetails.opponent.rating}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-300">You play as:</span>
                <span className={`font-bold ${matchDetails.color === 'white' ? 'text-white' : 'text-zinc-800 bg-zinc-300 px-2 rounded'}`}>
                  {matchDetails.color}
                </span>
              </div>
            </div>
            
            {playerReady ? (
              <div className="flex flex-col items-center justify-center p-4 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                <span className="text-zinc-400">Waiting for opponent...</span>
                <div className="w-full bg-zinc-700 rounded-full h-1.5 mt-2">
                  <div className="bg-green-500 h-1.5 rounded-full animate-pulse" style={{width: '45%'}}></div>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handleStartGame}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/30"
                >
                  Start Game
                </button>
                
                <button
                  onClick={() => {setMatchStatus('idle'); setMatchDetails(null);}}
                  className="w-full mt-3 py-2.5 bg-transparent border border-zinc-600 rounded-lg text-zinc-300 hover:bg-zinc-700/50 transition"
                >
                  Decline Match
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  </>
);
};

export default AddMatch;