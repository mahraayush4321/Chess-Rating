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
  const [isKingInCheck, setIsKingInCheck] = useState(false);
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  
  useEffect(() => {
    if (matchDetails?.timeControl) {
      setWhiteTime(matchDetails.timeControl);
      setBlackTime(matchDetails.timeControl);
    }
  }, [matchDetails]);

  useEffect(() => {
    if (bothPlayersReady && !gameOver) {
      const interval = setInterval(() => {
        if (currentPlayer === 'white') {
          setWhiteTime(prev => {
            if (prev <= 0) {
              clearInterval(interval);
              handleTimeOut('white');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime(prev => {
            if (prev <= 0) {
              clearInterval(interval);
              handleTimeOut('black');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
  
      setTimerInterval(interval);
      return () => clearInterval(interval);
    }
  }, [currentPlayer, bothPlayersReady, gameOver]);


  const handleTimeOut = (color) => {
    if (!bothPlayersReady) return; // Don't handle timeout if game hasn't started
    
    setGameOver(true);
    setWinner(color === 'white' ? 'black' : 'white');
    
    if (socket && matchDetails) {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      socket.emit('matchResult', {
        matchId: matchDetails.matchId,
        roomId: matchDetails.roomId,
        winner: color === playerColor ? opponentInfo.id : currentUser._id,
        loser: color === playerColor ? currentUser._id : opponentInfo.id,
        isDraw: false,
        byTimeout: true
      });
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);
  
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const matchId = params.get('matchId');
    const roomId = params.get('roomId');
    const timeControl = parseInt(params.get('timeControl')) || 300;
    const currentUser = JSON.parse(localStorage.getItem('user'));
  
    if (!matchId || !roomId || !currentUser) {
      console.error('Missing required parameters or user data');
      navigate('/');
      return;
    }

    setWhiteTime(timeControl);
    setBlackTime(timeControl);
  
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


  useEffect(() => {
    if (bothPlayersReady && !gameOver) {
      // Add a small delay before starting the timer
      const startDelay = setTimeout(() => {
        const interval = setInterval(() => {
          if (currentPlayer === 'white') {
            setWhiteTime(prev => {
              if (prev <= 0) {
                clearInterval(interval);
                handleTimeOut('white');
                return 0;
              }
              return prev - 1;
            });
          } else {
            setBlackTime(prev => {
              if (prev <= 0) {
                clearInterval(interval);
                handleTimeOut('black');
                return 0;
              }
              return prev - 1;
            });
          }
        }, 1000);
        
        setTimerInterval(interval);
      }, 1000); // 1 second delay before starting
  
      return () => {
        clearTimeout(startDelay);
        if (timerInterval) {
          clearInterval(timerInterval);
        }
      };
    }
  }, [currentPlayer, bothPlayersReady, gameOver]);
  
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
    setLastMove({ from, to });
    setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');
  };
  
  // Add these new states
  
  // Add this function to check if a king is in check
  const isKingUnderAttack = (boardState, kingColor) => {
    // Find king's position
    let kingRow, kingCol;
    const kingPiece = kingColor === 'white' ? 'wk' : 'bk';
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (boardState[i][j] === kingPiece) {
          kingRow = i;
          kingCol = j;
          break;
        }
      }
    }
    
    // Check if any opponent piece can attack the king
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = boardState[i][j];
        if (piece && getPieceColor(piece) !== kingColor) {
          if (isValidMove(boardState, i, j, kingRow, kingCol, getPieceColor(piece))) {
            return true;
          }
        }
      }
    }
    return false;
  };
  
  // Modify handleSquareClick to include check validation
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
    // Inside handleSquareClick, update the move validation section:
    if (selectedPiece) {
      if (isValidMove(board, selectedPiece.row, selectedPiece.col, row, col, currentPlayer)) {
        const newBoard = [...board.map(row => [...row])];
        const capturedPiece = newBoard[row][col];
        
        // Make temporary move
        newBoard[row][col] = selectedPiece.piece;
        newBoard[selectedPiece.row][selectedPiece.col] = '';
        
        // Check if this move would leave/put own king in check
        if (isKingUnderAttack(newBoard, currentPlayer)) {
          setErrorMessage("Invalid move: This would put your king in check!");
          setSelectedPiece(null);
          return;
        }
        
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
          
          // Add blood animation class to the captured square
          const square = document.querySelector(`[data-position="${row}-${col}"]`);
          if (square) {
            square.classList.add('king-death');
          }
          
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
        setLastMove({
          from: { row: selectedPiece.row, col: selectedPiece.col },
          to: { row, col }
        });
        
        // Check if opponent's king is in check after move
        const oppositeColor = currentPlayer === 'white' ? 'black' : 'white';
        const isCheck = isKingUnderAttack(newBoard, oppositeColor);
        setIsKingInCheck(isCheck);
        if (isCheck) {
          setErrorMessage(`${oppositeColor === 'white' ? 'White' : 'Black'} king is in check!`);
        }
        
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

  const getDisplayBoard = () => {
    if (playerColor === 'black') {
      // Reverse the board for black player
      return [...board].reverse().map(row => [...row].reverse());
    }
    return board;
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-gray-50 to-gray-100 p-4 text-gray-800">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
        <h1 className="text-4xl font-bold">♟️</h1>
      </div>
      <h1 className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-4xl font-bold text-transparent">
        Chess Game
      </h1>

      <div className="w-full max-w-4xl">
      {renderGameStatus()}

      {matchDetails && bothPlayersReady && (
        <div className="flex flex-col items-center justify-center gap-4">
          <Card className="w-full bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100">
            {/* Timer and game info section */}
            <div className="mb-4 text-center p-4 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`p-3 rounded-lg ${
                  currentPlayer === "white" 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-600"
                }`}>
                  White: {formatTime(whiteTime)}
                </div>
                <div className={`p-3 rounded-lg ${
                  currentPlayer === "black" 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-600"
                }`}>
                  Black: {formatTime(blackTime)}
                </div>
              </div>

              {/* Game status messages */}
              <div className="space-y-2">
                {gameOver && (
                  <div className="text-xl font-semibold text-blue-600">
                    Game Over! {winner === "white" ? "White" : "Black"} wins
                    {whiteTime <= 0 || blackTime <= 0 ? " by timeout!" : "!"}
                  </div>
                )}
                {currentPlayer !== playerColor && !gameOver && (
                  <div className="text-sm text-blue-600">
                    Waiting for opponent's move...
                  </div>
                )}
                {errorMessage && (
                  <div className="text-sm text-red-500">
                    {errorMessage}
                  </div>
                )}
                {opponentInfo && (
                  <div className="text-sm text-gray-600">
                    Playing against: {opponentInfo.name}
                  </div>
                )}
              </div>
            </div>

            {/* Chess board with updated styling */}
            <div className="grid grid-cols-8 rounded-xl overflow-hidden border border-gray-200 shadow-inner m-4">
              {getDisplayBoard().map((row, displayRowIndex) =>
                row.map((piece, displayColIndex) => {
                  const rowIndex = playerColor === "black" ? 7 - displayRowIndex : displayRowIndex;
                  const colIndex = playerColor === "black" ? 7 - displayColIndex : displayColIndex;
                  const isLight = (displayRowIndex + displayColIndex) % 2 === 0;
                  const isLastMoveFrom = lastMove?.from.row === rowIndex && lastMove?.from.col === colIndex;
                  const isLastMoveTo = lastMove?.to.row === rowIndex && lastMove?.to.col === colIndex;

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      data-position={`${rowIndex}-${colIndex}`}
                      className={`
                        w-14 h-14 flex items-center justify-center text-4xl cursor-pointer
                        transition-all duration-300 relative
                        ${isLight 
                          ? 'bg-[#EBECD0]' 
                          : 'bg-[#779556]'}
                        ${selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex
                          ? 'ring-2 ring-blue-400 ring-inset'
                          : ''}
                        ${currentPlayer === playerColor ? 'hover:brightness-110' : ''}
                        ${isKingInCheck && piece === (currentPlayer === "white" ? "wk" : "bk")
                          ? 'bg-red-100'
                          : ''}
                        ${isLastMoveFrom || isLastMoveTo ? 'ring-2 ring-blue-300/50' : ''}
                      `}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                      <span className={`
                        transform transition-all duration-300
                        ${getPieceColor(piece) === "white" 
                          ? "text-gray-900" 
                          : "text-gray-800"}
                        ${piece ? "text-4xl font-bold" : ""}
                        hover:scale-105
                      `}>
                        {getPieceSymbol(piece)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Action buttons */}
          <Button
            onClick={() => navigate("/home")}
            className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            Back to Home
          </Button>
        </div>
      )}
    </div>

    <AlertDialog open={gameOver}>
      <AlertDialogContent className="bg-white rounded-2xl shadow-xl border border-gray-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-gray-800">
            Game Over
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-6 text-center">
          <div className="text-5xl mb-4">
            {winner === playerColor ? "🏆" : "👏"}
          </div>
          <div className="text-xl text-gray-700">
            {winner === playerColor
              ? "Congratulations! You won the game!"
              : "Game Over! Your opponent won."}
          </div>
          {whiteTime <= 0 || blackTime <= 0 ? (
            <div className="mt-2 text-sm text-gray-500">
              Game ended by timeout
            </div>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              resetGame();
              navigate("/home");
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Back to Home
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
};

export default PlayPage;