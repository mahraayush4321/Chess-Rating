import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { pieces, initialBoard, getPieceSymbol, getPieceColor, isValidMove } from '../utils/chess';
import io from 'socket.io-client';

const PlayPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [board, setBoard] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [opponentInfo, setOpponentInfo] = useState(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [bothPlayersReady, setBothPlayersReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Parse query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const matchId = searchParams.get('matchId');
    const roomId = searchParams.get('roomId');
    
    if (matchId && roomId) {
      // We have match parameters from URL, try to rejoin the match
      console.log(`Attempting to rejoin match: ${matchId} in room: ${roomId}`);
    }
  }, [location]);
  
  useEffect(() => {
    // Initialize socket connection
    console.log("Initializing socket connection...");
    
    // Allow both WebSocket and polling for better compatibility
    socketRef.current = io('https://chess-rating.onrender.com', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
      setErrorMessage("Please log in to play");
      return;
    }
    
    // Connection events
    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully:', socketRef.current.id);
      setConnectionStatus('connected');
      
      // If we have query parameters, try to rejoin the match
      const searchParams = new URLSearchParams(location.search);
      const matchId = searchParams.get('matchId');
      const roomId = searchParams.get('roomId');
      
      if (matchId && roomId && currentUser) {
        console.log(`Rejoining match ${matchId} in room ${roomId}`);
        socketRef.current.emit('rejoinMatch', {
          matchId,
          roomId,
          playerId: currentUser._id
        });
      }
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('error');
      setErrorMessage(`Connection error: ${error.message}`);
    });
    
    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      
      // If the game is in progress, show reconnecting message
      if (bothPlayersReady && !gameOver) {
        setErrorMessage("Connection lost. Attempting to reconnect...");
      }
    });
    
    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
      setErrorMessage("");
      
      // Re-authenticate and rejoin room if needed
      const searchParams = new URLSearchParams(location.search);
      const matchId = searchParams.get('matchId');
      const roomId = searchParams.get('roomId');
      
      if (matchId && roomId && currentUser) {
        socketRef.current.emit('rejoinMatch', {
          matchId,
          roomId,
          playerId: currentUser._id
        });
      }
    });
    
    socketRef.current.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setConnectionStatus('failed');
      setErrorMessage("Failed to reconnect. Please refresh the page.");
    });
    
    // Match and game events
    socketRef.current.on('matchFound', (details) => {
      console.log('Match found:', details);
      setMatchDetails(details);
      setPlayerColor(details.color);
      setOpponentInfo(details.opponent);
      setIsSearching(false);
    });
    
    socketRef.current.on('matchmaking', (data) => {
      console.log('Matchmaking status:', data);
      if (data.status === 'searching') {
        setIsSearching(true);
      } else if (data.status === 'cancelled') {
        setIsSearching(false);
      }
    });
    
    socketRef.current.on('opponentMove', (data) => {
      console.log('Opponent move received:', data);
      handleOpponentMove(data.from, data.to);
    });
    
    socketRef.current.on('matchError', (error) => {
      console.error('Match error:', error);
      setErrorMessage(error.message);
    });
    
    socketRef.current.on('bothPlayersReady', (data) => {
      console.log('Both players ready:', data);
      setBothPlayersReady(true);
      setErrorMessage("");
    });
    
    socketRef.current.on('matchEnded', (data) => {
      console.log('Match ended:', data);
      setGameOver(true);
      setWinner(data.winner);
    });
    
    socketRef.current.on('gameState', (data) => {
      console.log('Received game state:', data);
      if (data.board) setBoard(data.board);
      if (data.currentPlayer) setCurrentPlayer(data.currentPlayer);
      if (data.playerColor) setPlayerColor(data.playerColor);
      if (data.opponentInfo) setOpponentInfo(data.opponentInfo);
      setBothPlayersReady(true);
    });
    
    // Send heartbeat every 30 seconds to keep the connection alive
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('heartbeat');
        console.log('Heartbeat sent');
      }
    }, 30000);
    
    return () => {
      clearInterval(heartbeatInterval);
      
      // Clean up socket connection
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('reconnect');
        socketRef.current.off('reconnect_failed');
        socketRef.current.off('matchFound');
        socketRef.current.off('matchmaking');
        socketRef.current.off('opponentMove');
        socketRef.current.off('matchError');
        socketRef.current.off('bothPlayersReady');
        socketRef.current.off('matchEnded');
        socketRef.current.off('gameState');
        
        // Only cancel matchmaking if we're still searching
        if (isSearching) {
          socketRef.current.emit('cancelMatchmaking');
        }
        
        socketRef.current.disconnect();
      }
    };
  }, [location.search]);
  
  const startSearching = () => {
    if (!socketRef.current || socketRef.current.disconnected) {
      setErrorMessage("Socket connection lost. Please refresh the page.");
      return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?._id) {
      setErrorMessage("You need to be logged in to find a match");
      return;
    }
    
    setErrorMessage("");
    socketRef.current.emit('findMatch', { playerId: currentUser._id });
  };
  
  const cancelSearching = () => {
    if (!socketRef.current || socketRef.current.disconnected) return;
    socketRef.current.emit('cancelMatchmaking');
    setIsSearching(false);
  };
  
  const markPlayerReady = () => {
    if (!socketRef.current || !matchDetails) return;
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    socketRef.current.emit('playerReady', {
      matchId: matchDetails.matchId,
      roomId: matchDetails.roomId,
      playerId: currentUser._id
    });
    
    setIsPlayerReady(true);
  };
  
  const handleOpponentMove = (from, to) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      const piece = newBoard[from.row][from.col];
      newBoard[to.row][to.col] = piece;
      newBoard[from.row][from.col] = '';
      
      // Check if the game is over (if the king was captured)
      const capturedPiece = prevBoard[to.row][to.col];
      if (capturedPiece === 'wk' || capturedPiece === 'bk') {
        setGameOver(true);
        setWinner(currentPlayer === 'white' ? 'black' : 'white');
      }
      
      return newBoard;
    });
    
    // Toggle current player
    setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');
  };
  
  const handleSquareClick = (row, col) => {
    // Don't allow moves if game is over or not the player's turn
    if (gameOver || currentPlayer !== playerColor || !bothPlayersReady) return;
    
    // Check socket connection
    if (!socketRef.current || socketRef.current.disconnected) {
      setErrorMessage("Connection lost. Please wait for reconnection or refresh the page.");
      return;
    }
    
    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);
    setErrorMessage("");
    
    // First click - select piece
    if (!selectedPiece && pieceColor === currentPlayer) {
      setSelectedPiece({ row, col, piece });
      return;
    }
    
    // First click - wrong color
    if (!selectedPiece && pieceColor !== currentPlayer) {
      if (piece) {
        setErrorMessage(`It's ${currentPlayer}'s turn to play`);
      }
      return;
    }
    
    // Second click - same square, deselect
    if (selectedPiece && row === selectedPiece.row && col === selectedPiece.col) {
      setSelectedPiece(null);
      return;
    }
    
    // Second click - friendly piece, change selection
    if (selectedPiece && pieceColor === currentPlayer) {
      setSelectedPiece({ row, col, piece });
      return;
    }
    
    // Second click - attempt to move
    if (selectedPiece) {
      if (isValidMove(board, selectedPiece.row, selectedPiece.col, row, col, currentPlayer)) {
        const newBoard = [...board.map(row => [...row])];
        const capturedPiece = newBoard[row][col];
        
        // Move piece
        newBoard[row][col] = selectedPiece.piece;
        newBoard[selectedPiece.row][selectedPiece.col] = '';
        
        // Emit move to opponent through socket
        if (socketRef.current && matchDetails) {
          socketRef.current.emit('chessMove', {
            roomId: matchDetails.roomId,
            from: { row: selectedPiece.row, col: selectedPiece.col },
            to: { row, col }
          });
        }
        
        // Check if game is over (king captured)
        if (capturedPiece === 'wk' || capturedPiece === 'bk') {
          setGameOver(true);
          setWinner(currentPlayer);
          
          // Emit match result
          if (socketRef.current && matchDetails) {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            socketRef.current.emit('matchResult', {
              matchId: matchDetails.matchId,
              roomId: matchDetails.roomId,
              winner: currentUser._id,
              loser: opponentInfo.id,
              isDraw: false
            });
          }
        }

        // Update board and game state
        setBoard(newBoard);
        setSelectedPiece(null);
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
      } else {
        // Invalid move
        const pieceType = selectedPiece.piece[1];
        let message = "Invalid move for ";
        switch(pieceType) {
          case 'p': message += "pawn"; break;
          case 'r': message += "rook"; break;
          case 'n': message += "knight"; break;
          case 'b': message += "bishop"; break;
          case 'q': message += "queen"; break;
          case 'k': message += "king"; break;
        }
        setErrorMessage(message);
        setSelectedPiece(null);
      }
    }
  };
  
  const resetGame = () => {
    setBoard(initialBoard);
    setSelectedPiece(null);
    setCurrentPlayer('white');
    setGameOver(false);
    setWinner(null);
    setBothPlayersReady(false);
    setIsPlayerReady(false);
  };
  
  // Render different states based on game progress
  const renderGameStatus = () => {
    // Show connection status if there's an issue
    if (connectionStatus === 'error' || connectionStatus === 'disconnected' || connectionStatus === 'failed') {
      return (
        <div className="text-center p-4 mb-2 bg-red-900/30 border border-red-700 rounded">
          <div className="text-red-300">
            {connectionStatus === 'error' && "Connection error. Trying to reconnect..."}
            {connectionStatus === 'disconnected' && "Disconnected from server. Reconnecting..."}
            {connectionStatus === 'failed' && "Failed to connect. Please refresh the page."}
          </div>
          {connectionStatus === 'failed' && (
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-600 hover:bg-red-700"
            >
              Refresh Page
            </Button>
          )}
        </div>
      );
    }
    
    if (isSearching) {
      return (
        <div className="text-center p-6">
          <div className="mb-4 text-xl">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Connecting with the opponent...
            </div>
          </div>
          <Button 
            onClick={cancelSearching} 
            className="bg-red-600 hover:bg-red-700"
          >
            Cancel
          </Button>
        </div>
      );
    }
    
    if (matchDetails && !isPlayerReady) {
      return (
        <div className="text-center p-6">
          <div className="mb-4">
            <div className="text-xl font-bold mb-2">Match Found!</div>
            <div>Opponent: {opponentInfo?.name} (Rating: {opponentInfo?.rating})</div>
            <div>You're playing as: {playerColor === 'white' ? 'White ⚪' : 'Black ⚫'}</div>
          </div>
          <Button 
            onClick={markPlayerReady} 
            className="bg-green-600 hover:bg-green-700"
          >
            Ready to Play
          </Button>
        </div>
      );
    }
    
    if (matchDetails && isPlayerReady && !bothPlayersReady) {
      return (
        <div className="text-center p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            <span className="text-xl">Waiting for opponent to be ready...</span>
          </div>
        </div>
      );
    }
    
    if (!matchDetails && !isSearching) {
      return (
        <div className="text-center p-6">
          <Button 
            onClick={startSearching} 
            className="bg-purple-600 hover:bg-purple-700"
          >
            CONNECT 
          </Button>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-zinc-900 to-black p-4 text-white">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 shadow-lg shadow-purple-500/20">
        <h1 className="text-4xl font-bold">♟️</h1>
      </div>
      <h1 className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-4xl font-bold text-transparent">
        Chess Game
      </h1>
      
      {renderGameStatus()}
      
      {matchDetails && bothPlayersReady && (
        <div className="flex flex-col items-center justify-center gap-4">
          <Card className="border-none bg-zinc-800/50 p-6">
            <div className="mb-4 text-center font-bold text-lg">
              <div className="text-white">
                {gameOver 
                  ? `Game Over! ${winner === 'white' ? 'White' : 'Black'} wins!` 
                  : `Current Turn: ${currentPlayer === 'white' ? 'White' : 'Black'}`
                }
                {currentPlayer !== playerColor && !gameOver && (
                  <div className="mt-1 text-sm font-normal text-yellow-400">
                    Waiting for opponent's move...
                  </div>
                )}
              </div>
              {errorMessage && (
                <div className="mt-2 text-sm font-normal text-red-400">
                  {errorMessage}
                </div>
              )}
              {opponentInfo && (
                <div className="mt-2 text-sm font-normal text-blue-400">
                  Playing against: {opponentInfo.name}
                </div>
              )}
            </div>
            <div className="grid grid-cols-8 border border-zinc-700">
              {board.map((row, rowIndex) => (
                row.map((piece, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      w-12 h-12 flex items-center justify-center text-3xl cursor-pointer
                      ${(rowIndex + colIndex) % 2 === 0 ? 'bg-zinc-700' : 'bg-zinc-800'}
                      ${selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex ? 'bg-purple-600/50' : ''}
                      ${currentPlayer === playerColor ? 'hover:bg-purple-500/20' : ''}
                    `}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    <span className={getPieceColor(piece) === 'white' ? 'text-gray-200' : 'text-gray-900'}>
                      {getPieceSymbol(piece)}
                    </span>
                  </div>
                ))
              ))}
            </div>
          </Card>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/home')} 
              variant="outline" 
              className="border-purple-500 bg-transparent text-purple-400 hover:bg-purple-950/30"
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}
      
      <AlertDialog open={gameOver}>
        <AlertDialogContent className="bg-zinc-800 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Game Over!</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-center py-4 text-zinc-300">
            {winner === playerColor 
              ? 'You won the game!' 
              : 'Your opponent won the game!'}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              resetGame();
              navigate('/home');
            }} className="bg-purple-600 hover:bg-purple-700">
              Back to Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlayPage;