import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { getPieceSymbol, getPieceColor, isValidMove, initialBoard } from '../utils/chess';
import { convertToAlgebraicNotation } from '../utils/chess/useChessGame';
import { motion, AnimatePresence } from 'framer-motion';

const PlayAI = () => {
  const [socket, setSocket] = useState(null);
  const [gameId, setGameId] = useState(`ai_game_${Date.now()}`);
  const [moves, setMoves] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [board, setBoard] = useState(initialBoard);
  const [difficulty, setDifficulty] = useState('beginner');
  const [lastMove, setLastMove] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [hintMove, setHintMove] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState('');
  const [hintFromSquare, setHintFromSquare] = useState(null);
  const [hintToSquare, setHintToSquare] = useState(null);

  useEffect(() => {
    const newSocket = io('https://chess-ai-webs.onrender.com');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to AI server');
    });

    newSocket.on('ai_move_response', (response) => {
      console.log('Received AI response:', response);
      
      if (response.success) {
        if (response.ai_move && response.ai_move.uci) {
          const move = response.ai_move.uci;
          const [fromSquare, toSquare] = move.match(/.{2}/g) || [];
          
          if (fromSquare && toSquare) {
            const fromCol = fromSquare.charCodeAt(0) - 97;
            const fromRow = 8 - parseInt(fromSquare[1]);
            const toCol = toSquare.charCodeAt(0) - 97;
            const toRow = 8 - parseInt(toSquare[1]);

            setBoard(prevBoard => {
              const newBoard = prevBoard.map(row => [...row]);
              newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
              newBoard[fromRow][fromCol] = '';
              return newBoard;
            });
            
            setLastMove({ from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } });
            setMoves(prevMoves => [...prevMoves, move]);
            setCurrentPlayer('white');
            setErrorMessage('');
          }
        }

        if (response.human_suggestion && response.human_suggestion.uci) {
          setHintMove(response.human_suggestion);
        }
      } else {
        setErrorMessage(response.error || 'AI failed to make a move');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setErrorMessage('Failed to connect to AI server');
    });

    return () => newSocket.disconnect();
  }, []);

  const handleSquareClick = (row, col) => {
    if (currentPlayer !== 'white') return;

    if (showHint) {
      setShowHint(false);
      setHintMessage('');
      setHintFromSquare(null);
      setHintToSquare(null);
    }

    if (!selectedPiece) {
      const piece = board[row][col];
      if (piece && getPieceColor(piece) === 'white') {
        setSelectedPiece({ row, col });
        setErrorMessage('');
      }
    } else {
      if (isValidMove(board, selectedPiece.row, selectedPiece.col, row, col, currentPlayer)) {
        if (!gameStarted) setGameStarted(true);
        
        const piece = board[selectedPiece.row][selectedPiece.col];
        const capturedPiece = board[row][col];
        
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = piece;
        newBoard[selectedPiece.row][selectedPiece.col] = '';
        setBoard(newBoard);

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const fromSquare = `${files[selectedPiece.col]}${8 - selectedPiece.row}`;
        const toSquare = `${files[col]}${8 - row}`;
        const moveUCI = `${fromSquare}${toSquare}`;

        const updatedMoves = [...moves, moveUCI];
        
        const requestData = {
          moves: updatedMoves,
          difficulty: difficulty,
          game_id: gameId
        };
        console.log('Sending to server:', JSON.stringify(requestData, null, 2));

        socket.emit('request_ai_move', requestData);
        setMoves(updatedMoves);
        setCurrentPlayer('black');
        setLastMove({ from: selectedPiece, to: { row, col } });
        setSelectedPiece(null);
      } else {
        setErrorMessage('Invalid move');
        setSelectedPiece(null);
      }
    }
  };

  const handleHintClick = () => {
    if (!hintMove || currentPlayer !== "white") return;

    const move = hintMove.uci;
    const [fromSquare, toSquare] = move.match(/.{2}/g) || [];

    console.log("Hint clicked:", { move, fromSquare, toSquare, hintMove });

    if (fromSquare && toSquare) {
      const fromCol = fromSquare.charCodeAt(0) - 97;
      const fromRow = 8 - parseInt(fromSquare[1]);
      const toCol = toSquare.charCodeAt(0) - 97;
      const toRow = 8 - parseInt(toSquare[1]);

      console.log("Hint coordinates:", { fromRow, fromCol, toRow, toCol });

      setHintFromSquare({ row: fromRow, col: fromCol });
      setHintToSquare({ row: toRow, col: toCol });

      setShowHint(true);
      setHintMessage(
        `Suggested move: ${
          hintMove.san
        } (Move ${fromSquare.toUpperCase()} to ${toSquare.toUpperCase()})`
      );

      setTimeout(() => {
        if (currentPlayer === "white") {
          setShowHint(false);
          setHintMessage("");
          setHintFromSquare(null);
          setHintToSquare(null);
        }
      }, 8000);
    }
  };

  const getDisplayBoard = () => board;

  const getArrowRotation = (fromRow, fromCol, toRow, toCol) => {
    const deltaRow = toRow - fromRow;
    const deltaCol = toCol - fromCol;
    const angle = Math.atan2(deltaRow, deltaCol) * (180 / Math.PI);
    return angle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 pt-16">
      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <Alert className="bg-red-100 text-red-800 border-red-300 shadow-md">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hintMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <Alert className="bg-blue-100 text-blue-800 border-blue-300 shadow-md">
                <AlertDescription>💡 {hintMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-72 space-y-3 sm:space-y-4"
          >
            <Card className="p-3 sm:p-4 bg-white/90 backdrop-blur-sm shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">
                Game Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => {
                      if (!gameStarted) {
                        const newDifficulty = e.target.value;
                        console.log('Difficulty changed to:', newDifficulty);
                        setDifficulty(newDifficulty);
                      }
                    }}
                    disabled={gameStarted}
                    className={`w-full mt-1 rounded-md border border-gray-300 p-2 ${
                      gameStarted ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                    }`}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Advanced</option>
                  </select>
                  {gameStarted && (
                    <p className="text-xs text-gray-500 mt-1">
                      Difficulty cannot be changed during the game
                    </p>
                  )}
                </div>
                
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Current Turn</span>
                    <motion.div
                      key={currentPlayer}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        currentPlayer === 'white' 
                          ? 'bg-white text-gray-800 border border-gray-300' 
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      {currentPlayer === 'white' ? 'Your Turn' : 'AI Thinking...'}
                    </motion.div>
                  </div>
                </div>
                
                <div className="pt-2 space-y-2">
                  <Button 
                    onClick={handleHintClick}
                    disabled={currentPlayer !== 'white' || !hintMove || !gameStarted}
                    className={`w-full ${
                      showHint 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    } text-white shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    {showHint ? '✨ Hint Active' : '💡 Get Hint'}
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setBoard(initialBoard);
                      setMoves([]);
                      setCurrentPlayer('white');
                      setSelectedPiece(null);
                      setLastMove(null);
                      setGameStarted(false);
                      setGameId(`ai_game_${Date.now()}`);
                      setErrorMessage('');
                      setHintMove(null);
                      setShowHint(false);
                      setHintMessage('');
                      setHintFromSquare(null);
                      setHintToSquare(null);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  >
                    New Game
                  </Button>
                </div>

              </div>
            </Card>
          </motion.div>

          {/* Chess Board */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            <div
              className="mx-auto"
              style={{ maxWidth: "min(100vw - 2rem, 500px)", width: "100%" }}
            >
              <div className="overflow-hidden rounded-xl border-2 border-gray-300 shadow-xl">
                <div
                  className="grid grid-cols-8 w-full"
                  style={{ contain: "layout" }}
                >
                  {getDisplayBoard().map((row, displayRowIndex) =>
                    row.map((piece, displayColIndex) => {
                      const isLight = (displayRowIndex + displayColIndex) % 2 === 0;
                      const isLastMoveFrom =
                        lastMove?.from.row === displayRowIndex &&
                        lastMove?.from.col === displayColIndex;
                      const isLastMoveTo =
                        lastMove?.to.row === displayRowIndex &&
                        lastMove?.to.col === displayColIndex;
                      const isSelected =
                        selectedPiece?.row === displayRowIndex &&
                        selectedPiece?.col === displayColIndex;
                      
                      const isHintFrom = 
                        hintFromSquare?.row === displayRowIndex &&
                        hintFromSquare?.col === displayColIndex;
                      const isHintTo = 
                        hintToSquare?.row === displayRowIndex &&
                        hintToSquare?.col === displayColIndex;

                      return (
                        <motion.div
                          key={`${displayRowIndex}-${displayColIndex}`}
                          onClick={() => handleSquareClick(displayRowIndex, displayColIndex)}
                          className={`
                            aspect-square flex items-center justify-center relative
                            ${isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]"}
                            ${isSelected ? "ring-2 ring-yellow-400 ring-offset-1 sm:ring-offset-2" : ""}
                            ${isHintFrom && showHint ? "bg-green-400 ring-4 ring-green-600" : ""}
                            ${isHintTo && showHint ? "bg-pink-400 ring-4 ring-pink-600" : ""}
                            ${(isLastMoveFrom || isLastMoveTo) && !showHint ? "bg-[#f7f769]" : ""}
                            cursor-pointer transition-all duration-300
                          `}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.1 }}
                        >
                          {isHintFrom && showHint && (
                            <div className="absolute inset-0 bg-green-500 opacity-70 flex items-center justify-center">
                              <span className="text-white text-sm font-bold bg-green-700 px-2 py-1 rounded">FROM</span>
                            </div>
                          )}
                          
                          {isHintTo && showHint && (
                            <div className="absolute inset-0 bg-pink-500 opacity-70 flex items-center justify-center">
                              <span className="text-white text-sm font-bold bg-pink-700 px-2 py-1 rounded">TO</span>
                            </div>
                          )}

                          {isHintFrom && showHint && (
                            <div className="absolute top-1 right-1 text-2xl">
                              ➤
                            </div>
                          )}

                          {piece && (
                            <motion.span
                              key={`${displayRowIndex}-${displayColIndex}-${piece}`}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ 
                                scale: isSelected ? 1.1 : (isHintFrom && showHint ? 1.2 : 1),
                                opacity: 1
                              }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 500,
                                damping: 15
                              }}
                              className={`
                                text-3xl sm:text-4xl md:text-5xl z-20 relative
                                ${
                                  getPieceColor(piece) === "white"
                                    ? "text-white drop-shadow-lg"
                                    : "text-gray-900 drop-shadow-lg"
                                }
                              `}
                            >
                              {getPieceSymbol(piece)}
                            </motion.span>
                          )}
                          
                          {/* Coordinates for debugging */}
                          <span className="absolute bottom-0 right-0 text-xs opacity-30 z-10">
                            {String.fromCharCode(97 + displayColIndex)}{8 - displayRowIndex}
                          </span>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>  
  );
};

export default PlayAI;