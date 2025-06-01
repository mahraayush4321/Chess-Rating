import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { initialBoard, getPieceSymbol, getPieceColor, isValidMove } from '../chess';
import io from 'socket.io-client';
import { ML_API } from '../../config/api';

export const convertToAlgebraicNotation = (from, to, piece, board, capturedPiece = '') => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  
  const fromFile = files[from.col];
  const fromRank = 8 - from.row;
  const toFile = files[to.col];
  const toRank = 8 - to.row;
  
  const pieceType = piece[1];
  let notation = '';
  
  switch(pieceType) {
    case 'p':
      if (capturedPiece) {
        notation = `${fromFile}x${toFile}${toRank}`;
      } else {
        notation = `${toFile}${toRank}`;
      }
      break;
    case 'n':
      notation = `N${capturedPiece ? 'x' : ''}${toFile}${toRank}`;
      break;
    case 'b':
      notation = `B${capturedPiece ? 'x' : ''}${toFile}${toRank}`;
      break;
    case 'r':
      notation = `R${capturedPiece ? 'x' : ''}${toFile}${toRank}`;
      break;
    case 'q':
      notation = `Q${capturedPiece ? 'x' : ''}${toFile}${toRank}`;
      break;
    case 'k':
      if (fromFile === 'e' && toFile === 'g') {
        notation = 'O-O';
      } else if (fromFile === 'e' && toFile === 'c') {
        notation = 'O-O-O';
      } else {
        notation = `K${capturedPiece ? 'x' : ''}${toFile}${toRank}`;
      }
      break;
  }
  
  return notation;
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const useChessGame = () => {
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
  const [moveHistory, setMoveHistory] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    (async() => {
      if (gameOver && moveHistory.length > 0) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const payload = { 
          moves: moveHistory,
          playerColor,
          winner,
          timeControl: matchDetails?.timeControl,
          playerId: currentUser?._id,
          matchId: matchDetails?.matchId,
          opponentId: opponentInfo?.id,
        };
        
        console.log('Sending game data to API:', payload);
        try {
          const response = await fetch(`${ML_API.BASE_URL}${ML_API.ENDPOINTS.ANALYZE}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit', 
            body: JSON.stringify(payload),
          });
          
          
          const data = await response.json();
          console.log('Analysis response:', data);
          if (response.ok && data.result_url) {
            const pollInterval = setInterval(async () => {
              try {
                const analysisResponse = await fetch(data.result_url);
                const analysisData = await analysisResponse.json();
                
                if (analysisData && !analysisData.error) {
                  clearInterval(pollInterval);
                  setAnalysisData(analysisData);
                  setShowAnalysis(true);
                }
              } catch (error) {
                console.error('Error fetching analysis:', error);
              }
            }, 2000);
  
            setTimeout(() => clearInterval(pollInterval), 30000);
          }
          
        } catch (error) {
          console.error('Error sending game data:', error);
        }
      } else {
        console.log('Not sending data:', { gameOver, moveHistoryLength: moveHistory.length });
      }
    })();
  }, [gameOver, moveHistory, playerColor, winner, matchDetails, opponentInfo]);

  useEffect(() => {
    if (matchDetails?.timeControl) {
      setWhiteTime(matchDetails.timeControl);
      setBlackTime(matchDetails.timeControl);
    }
  }, [matchDetails]);

   useEffect(() => {
    if (gameOver) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [gameOver]); 

   useEffect(() => {
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    
    if (bothPlayersReady && !gameOver) {
      const interval = setInterval(() => {
        if (currentPlayer === 'white') {
          setWhiteTime(prev => {
            if (prev <= 0) {
              clearInterval(interval);
              timerIntervalRef.current = null;
              handleTimeOut('white');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime(prev => {
            if (prev <= 0) {
              clearInterval(interval);
              timerIntervalRef.current = null;
              handleTimeOut('black');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
  
      timerIntervalRef.current = interval;
    }

    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentPlayer, bothPlayersReady, gameOver]);

  
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const matchId = params.get('matchId');
    const roomId = params.get('roomId');
    const timeControl = parseInt(params.get('timeControl')) || 300;
    const currentUser = JSON.parse(localStorage.getItem('user'));
  
    if (!matchId || !roomId || !currentUser || !timeControl) {
      console.error('Missing required parameters or user data');
      navigate('/');
      return;
    }

    console.log('Setting up game with time control:', timeControl, 'seconds');

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
      
     
      if (data.player1 && data.player2) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const isPlayer1 = data.player1.id === currentUser._id;
        
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

 
  const startSearching = () => {
    if (!socket) return;
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?._id) {
      setErrorMessage("You need to be logged in to find a match");
      return;
    }
    
    socket.emit('findMatch', { playerId: currentUser._id });
    setIsSearching(true);
  };
  
  
  const cancelSearching = () => {
    if (!socket) return;
    socket.emit('cancelMatchmaking');
    setIsSearching(false);
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
      const capturedPiece = newBoard[to.row][to.col];
      
      
      const moveNotation = convertToAlgebraicNotation(from, to, piece, prevBoard, capturedPiece);
      setMoveHistory(prev => [...prev, moveNotation]);
      
      newBoard[to.row][to.col] = piece;
      newBoard[from.row][from.col] = '';
      
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

    
        const moveNotation = convertToAlgebraicNotation(
          { row: selectedPiece.row, col: selectedPiece.col },
          { row, col },
          selectedPiece.piece,
          board,
          capturedPiece
        );
        
        setMoveHistory(prev => {
          const newHistory = [...prev, moveNotation];
          return newHistory;
        });
        
       
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
          default: message += "piece";
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
    setMoveHistory([]);
  };

 
  const getDisplayBoard = () => {
    if (playerColor === 'black') {
      return [...board].reverse().map(row => [...row].reverse());
    }
    return board;
  };

  return {
    
    board,
    currentPlayer,
    playerColor,
    selectedPiece,
    lastMove,
    gameOver,
    winner,
    errorMessage,
    isKingInCheck,

    matchDetails,
    opponentInfo,
    isPlayerReady,
    bothPlayersReady,
    isSearching,
    
    whiteTime,
    blackTime,
    
    showTurnAlert,
    analysisData,
    showAnalysis,
    activeTab,
    moveHistory,
    
    formatTime,
    getDisplayBoard,
    getPieceSymbol,
    getPieceColor,
  
    setActiveTab,
    handleSquareClick,
    startSearching,
    cancelSearching,
    markPlayerReady,
    handleResign,
    resetGame,
    navigate
  };
};