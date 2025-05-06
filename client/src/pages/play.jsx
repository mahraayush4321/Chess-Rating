import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { pieces, initialBoard, getPieceSymbol, getPieceColor, isValidMove } from '../utils/chess';

const PlayPage = () => {
  // Add error message state
  const [errorMessage, setErrorMessage] = useState("");
  
  const [board, setBoard] = useState(initialBoard);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Handle piece selection and movement
  const handleSquareClick = (row, col) => {
    if (gameOver) return;

    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);

    // Clear error message on new selection
    setErrorMessage("");

    if (!selectedPiece && pieceColor !== currentPlayer) {
      if (piece) {
        setErrorMessage(`It's ${currentPlayer}'s turn to play`);
      }
      return;
    }

    // If no piece is selected and the square contains a piece of the current player's color
    if (!selectedPiece && pieceColor === currentPlayer) {
      setSelectedPiece({ row, col, piece });
      return;
    }

    // If a piece is already selected
    if (selectedPiece) {
      // If clicking on the same piece, deselect it
      if (row === selectedPiece.row && col === selectedPiece.col) {
        setSelectedPiece(null);
        return;
      }

      // If clicking on another piece of the same color, select that piece instead
      if (pieceColor === currentPlayer) {
        setSelectedPiece({ row, col, piece });
        return;
      }

      // Otherwise, try to move the piece
      if (isValidMove(board, selectedPiece.row, selectedPiece.col, row, col, currentPlayer)) {
        const newBoard = [...board.map(row => [...row])];
        newBoard[row][col] = selectedPiece.piece;
        newBoard[selectedPiece.row][selectedPiece.col] = '';
  
        // Check for king capture (simplified win condition)
        if (piece === 'bk' || piece === 'wk') {
          setGameOver(true);
          setWinner(currentPlayer);
        }
  
        setBoard(newBoard);
        setSelectedPiece(null);
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
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-zinc-900 to-black p-4 text-white">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 shadow-lg shadow-purple-500/20">
        <h1 className="text-4xl font-bold">♟️</h1>
      </div>
      <h1 className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 bg-clip-text text-4xl font-bold text-transparent">
        Chess Game
      </h1>

      <div className="flex flex-col items-center justify-center gap-4">
        <Card className="border-none bg-zinc-800/50 p-6">
          <div className="mb-4 text-center font-bold text-lg">
            <div className="text-white">
              {gameOver 
                ? `Game Over! ${winner === 'white' ? 'White' : 'Black'} wins!` 
                : `Current Turn: ${currentPlayer === 'white' ? 'White' : 'Black'}`
              }
            </div>
            {errorMessage && (
              <div className="mt-2 text-sm font-normal text-red-400">
                {errorMessage}
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
                    hover:bg-purple-500/20
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
          <Button onClick={resetGame} variant="outline" className="border-purple-500 bg-transparent text-purple-400 hover:bg-purple-950/30">
            Reset Game
          </Button>
          <Button asChild variant="outline" className="border-purple-500 bg-transparent text-purple-400 hover:bg-purple-950/30">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>

      <AlertDialog open={gameOver}>
        <AlertDialogContent className="bg-zinc-800 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Game Over!</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-center py-4 text-zinc-300">
            {winner === 'white' ? 'White' : 'Black'} player has won the game!
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={resetGame} className="bg-purple-600 hover:bg-purple-700">
              Play Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlayPage;