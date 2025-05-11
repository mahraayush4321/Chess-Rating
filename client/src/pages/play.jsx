import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
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
  const [showTurnAlert, setShowTurnAlert] = useState(false);
  
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
    if (!bothPlayersReady) return;
    
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
      query: {
        matchId,
        roomId,
        playerId: currentUser._id
      }
    });
    
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected to game server');
      newSocket.emit('joinMatch', {
        matchId,
        roomId,
        playerId: currentUser._id
      });
    });

    newSocket.on('bothPlayersReady', (data) => {
      console.log('Both players ready:', data);
      setBothPlayersReady(true);
    });

    newSocket.on('opponentMove', (data) => {
      console.log('Opponent move received:', data);
      handleOpponentMove(data.from, data.to);
      
      // Show turn alert when it's player's turn
      if (bothPlayersReady && !gameOver) {
        setShowTurnAlert(true);
        setTimeout(() => setShowTurnAlert(false), 3000);
      }
    });

    newSocket.on('matchEnded', (data) => {
      console.log('Match ended:', data);
      setGameOver(true);
      
      if (data.isDraw) {
        setWinner(null);
      } else {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        setWinner(data.winner === currentUser._id ? playerColor : (playerColor === 'white' ? 'black' : 'white'));
      }
      
      // You can also display updated ratings
      if (data.player1 && data.player2) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const isPlayer1 = data.player1.id === currentUser._id;
        
        // Update local state with new ratings if needed
        if (isPlayer1 && opponentInfo) {
          setOpponentInfo({
            ...opponentInfo,
            rating: data.player2.newRating
          });
        } else if (opponentInfo) {
          setOpponentInfo({
            ...opponentInfo,
            rating: data.player1.newRating
          });
        }
      }
    });

    newSocket.on('matchError', (error) => {
      console.error('Match error:', error);
      setErrorMessage(error.message || 'An error occurred with the match');
    });
  



    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      // Not showing connection error message anymore
    });

    newSocket.on('matchFound', (details) => {
      console.log('Match details received:', details);
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
      // Not showing connection lost message anymore
      
      if (reason === "transport close" || reason === "transport error") {
        setTimeout(() => {
          newSocket.connect();
        }, 1000);
      }
    });
  
    return () => {
      if (newSocket) {
        if (isSearching) {
          newSocket.emit('cancelMatchmaking');
        }
        newSocket.disconnect();
      }
    };
  }, [location.search, navigate]);

  useEffect(() => {
    if (bothPlayersReady && !gameOver) {
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
      }, 1000);
  
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

  const handleResign = () => {
    if (!socket || !matchDetails || gameOver) return;
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    setGameOver(true);
    setWinner(playerColor === 'white' ? 'black' : 'white');
    
    socket.emit('matchResult', {
      matchId: matchDetails.matchId,
      roomId: matchDetails.roomId,
      winner: opponentInfo.id,       
      loser: currentUser._id,     
      isDraw: false,
      byResignation: true
    });
};
  
  const handleOpponentMove = (from, to) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      const piece = newBoard[from.row][from.col];
      newBoard[to.row][to.col] = piece;
      newBoard[from.row][from.col] = '';
      
      const capturedPiece = prevBoard[to.row][to.col];
      if (capturedPiece === 'wk' || capturedPiece === 'bk') {
        setGameOver(true);
        setWinner(currentPlayer === 'white' ? 'black' : 'white');
      }
      return newBoard;
    });
    
    setLastMove({ from, to });
    setCurrentPlayer(prev => prev === 'white' ? 'black' : 'white');
  };
  
  const isKingUnderAttack = (boardState, kingColor) => {
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
  
  const handleSquareClick = (row, col) => {
    if (gameOver || currentPlayer !== playerColor || !bothPlayersReady) return;
    
    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);
    setErrorMessage("");
    
    if (!selectedPiece && pieceColor === currentPlayer) {
      setSelectedPiece({ row, col, piece });
      return;
    }
    
    if (!selectedPiece && pieceColor !== currentPlayer) {
      if (piece) {
        setErrorMessage(`It's ${currentPlayer}'s turn to play`);
      }
      return;
    }
    
    if (selectedPiece && row === selectedPiece.row && col === selectedPiece.col) {
      setSelectedPiece(null);
      setLastMove(null);
      return;
    }
    
    if (selectedPiece && pieceColor === currentPlayer) {
      setSelectedPiece({ row, col, piece });
      setLastMove(null);
      return;
    }
    
    if (selectedPiece) {
      if (isValidMove(board, selectedPiece.row, selectedPiece.col, row, col, currentPlayer)) {
        const newBoard = [...board.map(row => [...row])];
        const capturedPiece = newBoard[row][col];
        
        newBoard[row][col] = selectedPiece.piece;
        newBoard[selectedPiece.row][selectedPiece.col] = '';
        
        if (isKingUnderAttack(newBoard, currentPlayer)) {
          setErrorMessage("Invalid move: This would put your king in check!");
          setSelectedPiece(null);
          return;
        }
        
        if (socket && matchDetails) {
          socket.emit('chessMove', {
            roomId: matchDetails.roomId,
            from: { row: selectedPiece.row, col: selectedPiece.col },
            to: { row, col }
          });
        }
        
        if (capturedPiece === 'wk' || capturedPiece === 'bk') {
          setGameOver(true);
          setWinner(currentPlayer);
          
          const square = document.querySelector(`[data-position="${row}-${col}"]`);
          if (square) {
            square.classList.add('king-death');
          }
          
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
    
        setBoard(newBoard);
        setSelectedPiece(null);
        setLastMove({
          from: { row: selectedPiece.row, col: selectedPiece.col },
          to: { row, col }
        });
        
        const oppositeColor = currentPlayer === 'white' ? 'black' : 'white';
        const isCheck = isKingUnderAttack(newBoard, oppositeColor);
        setIsKingInCheck(isCheck);
        if (isCheck) {
          setErrorMessage(`${oppositeColor === 'white' ? 'White' : 'Black'} king is in check!`);
        }
        
        setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
      } else {
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
    setLastMove(null);
  };

  const getDisplayBoard = () => {
    if (playerColor === 'black') {
      return [...board].reverse().map(row => [...row].reverse());
    }
    return board;
  };
  
  const renderGameStatus = () => {
    if (isSearching) {
      return (
        <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-md mb-6">
          <div className="mb-4 text-lg sm:text-xl">Connecting with the opponent...</div>
          <Button 
            onClick={cancelSearching} 
            className="bg-red-600 hover:bg-red-700 text-sm sm:text-base"
          >
            Cancel
          </Button>
        </div>
      );
    }
    
    if (matchDetails && !isPlayerReady) {
      return (
        <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <div className="text-lg sm:text-xl font-bold mb-2">Match Found!</div>
            <div className="text-sm sm:text-base">Opponent: {opponentInfo?.name} (Rating: {opponentInfo?.rating})</div>
            <div className="text-sm sm:text-base">You're playing as: {playerColor === 'white' ? 'White ⚪' : 'Black ⚫'}</div>
          </div>
          <Button 
            onClick={markPlayerReady} 
            className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
          >
            Ready to Play
          </Button>
        </div>
      );
    }
    
    if (matchDetails && isPlayerReady && !bothPlayersReady) {
      return (
        <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-md mb-6">
          <div className="text-lg sm:text-xl">Waiting for opponent to be ready...</div>
        </div>
      );
    }
    
    if (!matchDetails && !isSearching) {
      return (
        <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-md mb-6">
          <Button 
            onClick={startSearching} 
            className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base"
          >
            CONNECT 
          </Button>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* Header - Responsive Design */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-white text-sm sm:text-xl">♔</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold">ChessMaster</h1>
          </div>
          <Button
            onClick={() => navigate("/home")}
            variant="outline"
            size="sm"
            className="border-red-500 text-red-500 hover:bg-red-50 text-xs sm:text-sm"
          >
            Exit Game
          </Button>
        </div>
      </header>

        <Button
          onClick={handleResign}
          variant="outline"
          className="w-full mt-2 border-red-500 text-red-500 hover:bg-red-50"
          disabled={!bothPlayersReady || gameOver}
        >
          Resign
        </Button>

      {/* Main Game Area - Fully Responsive */}
      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {renderGameStatus()}

        {matchDetails && bothPlayersReady && (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Panel - Player Info (Hidden on mobile) */}
            <div className="hidden sm:block w-full lg:w-64 space-y-3 sm:space-y-4">
              <Card className="p-3 sm:p-4">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  Game Info
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Opponent</p>
                    <p className="text-sm sm:text-base font-medium">
                      {opponentInfo?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Rating</p>
                    <p className="text-sm sm:text-base font-medium">
                      {opponentInfo?.rating}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      You're playing as
                    </p>
                    <div
                      className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${
                        playerColor === "white"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-800 text-white"
                      }`}
                    >
                      {playerColor === "white" ? "White" : "Black"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Timers */}
              <Card className="p-3 sm:p-4">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  Timers
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  <div
                    className={`p-2 sm:p-3 rounded-lg ${
                      currentPlayer === "white"
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <p className="text-xs sm:text-sm text-gray-500">White</p>
                    <p className="text-xl sm:text-2xl font-mono font-bold">
                      {formatTime(whiteTime)}
                    </p>
                  </div>
                  <div
                    className={`p-2 sm:p-3 rounded-lg ${
                      currentPlayer === "black"
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <p className="text-xs sm:text-sm text-gray-500">Black</p>
                    <p className="text-xl sm:text-2xl font-mono font-bold">
                      {formatTime(blackTime)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Center Panel - Chess Board */}
            <div className="flex-1">
              {/* Game Status - Responsive */}
              {(errorMessage ||
                (currentPlayer !== playerColor && !showTurnAlert)) && (
                <div
                  className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg text-center text-xs sm:text-sm ${
                    errorMessage
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {errorMessage || "Waiting for opponent's move..."}
                </div>
              )}

              {/* Your Turn Alert */}
              {showTurnAlert && currentPlayer === playerColor && (
                <Alert className="mb-3 sm:mb-4 bg-green-100 text-green-800 border-green-300">
                  <AlertDescription className="text-center font-medium">
                    It's your turn to move!
                  </AlertDescription>
                </Alert>
              )}

              {/* Chess Board - Responsive Sizing with Fixed Width on Desktop */}
              <div
                className="mx-auto"
                style={{ maxWidth: "min(100vw - 2rem, 500px)", width: "100%" }}
              >
                <div className="overflow-hidden rounded-lg sm:rounded-xl border border-gray-200 shadow-md">
                  <div
                    className="grid grid-cols-8 w-full"
                    style={{ contain: "layout" }}
                  >
                    {getDisplayBoard().map((row, displayRowIndex) =>
                      row.map((piece, displayColIndex) => {
                        const rowIndex =
                          playerColor === "black"
                            ? 7 - displayRowIndex
                            : displayRowIndex;
                        const colIndex =
                          playerColor === "black"
                            ? 7 - displayColIndex
                            : displayColIndex;
                        const isLight =
                          (displayRowIndex + displayColIndex) % 2 === 0;
                        const isLastMoveFrom =
                          lastMove?.from.row === rowIndex &&
                          lastMove?.from.col === colIndex;
                        const isLastMoveTo =
                          lastMove?.to.row === rowIndex &&
                          lastMove?.to.col === colIndex;

                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            data-position={`${rowIndex}-${colIndex}`}
                            className={`
                              aspect-square flex items-center justify-center relative
                              ${isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]"}
                              ${
                                selectedPiece?.row === rowIndex &&
                                selectedPiece?.col === colIndex
                                  ? "ring-2 ring-yellow-400 ring-offset-1 sm:ring-offset-2"
                                  : ""
                              }
                              ${
                                isLastMoveFrom || isLastMoveTo
                                  ? "bg-[#f7f769]"
                                  : ""
                              }
                              ${
                                isKingInCheck &&
                                piece ===
                                  (currentPlayer === "white" ? "wk" : "bk")
                                  ? "bg-red-200"
                                  : ""
                              }
                              ${
                                currentPlayer === playerColor && !piece
                                  ? "cursor-pointer hover:bg-opacity-80"
                                  : ""
                              }
                              transition-colors duration-150
                            `}
                            onClick={() =>
                              handleSquareClick(rowIndex, colIndex)
                            }
                          >
                            {piece && (
                              <span
                                className={`
                                text-3xl sm:text-4xl md:text-5xl
                                ${
                                  getPieceColor(piece) === "white"
                                    ? "text-white drop-shadow-lg"
                                    : "text-gray-900 drop-shadow-lg"
                                }
                                ${
                                  selectedPiece?.row === rowIndex &&
                                  selectedPiece?.col === colIndex
                                    ? "scale-110"
                                    : ""
                                }
                                transition-transform duration-100
                              `}
                              >
                                {getPieceSymbol(piece)}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Info Panel (Hidden on desktop) */}
              <div className="sm:hidden mt-4 space-y-3">
                <Card className="p-3">
                  <h2 className="text-sm font-semibold mb-2">Game Info</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Opponent</p>
                      <p className="text-sm font-medium">
                        {opponentInfo?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rating</p>
                      <p className="text-sm font-medium">
                        {opponentInfo?.rating}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">You play as</p>
                      <p className="text-sm font-medium">
                        {playerColor === "white" ? "White" : "Black"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Turn</p>
                      <p className="text-sm font-medium">
                        {currentPlayer === playerColor
                          ? "Your move"
                          : "Opponent"}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-3">
                  <h2 className="text-sm font-semibold mb-2">Timers</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`p-2 rounded ${
                        currentPlayer === "white"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <p className="text-xs text-gray-500">White</p>
                      <p className="text-lg font-mono font-bold">
                        {formatTime(whiteTime)}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded ${
                        currentPlayer === "black"
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <p className="text-xs text-gray-500">Black</p>
                      <p className="text-lg font-mono font-bold">
                        {formatTime(blackTime)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Game Over Dialog - Responsive */}
      <AlertDialog open={gameOver}>
        <AlertDialogContent className="max-w-xs sm:max-w-md mx-2 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl sm:text-2xl font-bold text-center">
              {winner === playerColor
                ? "Victory!"
                : winner === null
                ? "Draw"
                : "Game Over"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4 sm:py-6 text-center space-y-3 sm:space-y-4">
            <div className="text-4xl sm:text-6xl">
              {winner === playerColor ? "🏆" : winner === null ? "🤝" : "👏"}
            </div>
            <p className="text-sm sm:text-lg">
              {winner === playerColor
                ? "Congratulations on your win!"
                : winner === null
                ? "The game ended in a draw"
                : "Thanks for playing!"}
            </p>
            {(whiteTime <= 0 || blackTime <= 0) && (
              <p className="text-xs sm:text-sm text-gray-500">
                Game ended by timeout
              </p>
            )}

            {/* Add rating information if available */}
            {opponentInfo && (
              <div className="mt-4 text-sm">
                <p>
                  Your new rating:{" "}
                  <span className="font-semibold">
                    {/* Add your updated rating here */}
                  </span>
                </p>
                <p>
                  Opponent's rating:{" "}
                  <span className="font-semibold">{opponentInfo.rating}</span>
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => {
                resetGame();
                navigate("/home");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
            >
              Return to Lobby
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlayPage;