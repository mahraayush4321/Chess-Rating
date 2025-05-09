import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { pieces, initialBoard, getPieceSymbol, getPieceColor, isValidMove } from '../utils/chess';
import io from 'socket.io-client';

const PlayPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
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
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const matchId = params.get('matchId');
    const roomId = params.get('roomId');
    const currentUser = JSON.parse(localStorage.getItem('user'));
  
    if (!matchId || !roomId || !currentUser) {
      console.error('Missing required parameters or user data');
      navigate('/');
      return;
    }
  
    const newSocket = io('https://chess-rating.onrender.com', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 60000,
      query: { // Add query parameters
        matchId,
        roomId,
        playerId: currentUser._id
      }
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected to game server');
      // Join match room immediately after connection
      newSocket.emit('joinMatch', {
        matchId,
        roomId,
        playerId: currentUser._id
      });
    });

    // Add these new event listeners
    newSocket.on('bothPlayersReady', (data) => {
      console.log('Both players ready:', data);
      setBothPlayersReady(true);
    });

    newSocket.on('opponentMove', (data) => {
      console.log('Opponent move received:', data);
      handleOpponentMove(data.from, data.to);
    });

    // Add connection error handler
    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setErrorMessage('Failed to connect to game server. Retrying...');
    });

    newSocket.on('matchFound', (details) => {
      console.log('Match details received:', details);
      // Update URL with match details
      const searchParams = new URLSearchParams();
      searchParams.set('matchId', details.matchId);
      searchParams.set('roomId', details.roomId);
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      
      setMatchDetails(details);
      setPlayerColor(details.color);
      setOpponentInfo(details.opponent);
      setIsSearching(false);
    });
  
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setErrorMessage('Connection lost. Attempting to reconnect...');
      
      // Attempt to reconnect
      if (reason === "transport close" || reason === "transport error") {
        setTimeout(() => {
          newSocket.connect();
        }, 1000);
      }
    });
  
    return () => {
      if (newSocket) {
        // Only cancel matchmaking if we're still searching
        if (isSearching) {
          newSocket.emit('cancelMatchmaking');
        }
        newSocket.disconnect();
      }
    };
  }, [location.search, navigate]);
  
  const startSearching = () => {
    if (!socket) return;
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?._id) {
      setErrorMessage("You need to be logged in to find a match");
      return;
    }
    
    socket.emit('findMatch', { playerId: currentUser._id });
  };
  
  const cancelSearching = () => {
    if (!socket) return;
    socket.emit('cancelMatchmaking');
  };
  
  const markPlayerReady = () => {
    if (!socket || !matchDetails) return;
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    socket.emit('playerReady', {
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
        if (socket && matchDetails) {
          socket.emit('chessMove', {
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
          if (socket && matchDetails) {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            socket.emit('matchResult', {
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
    if (isSearching) {
      return (
        <div className="text-center p-6">
          <div className="mb-4 text-xl">Connecting with the opponent...</div>
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
          <div className="text-xl">Waiting for opponent to be ready...</div>
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