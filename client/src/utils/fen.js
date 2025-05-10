/**
 * Converts a piece to FEN notation
 * @param {string} piece - The piece in our format (e.g., 'wp', 'bk')
 * @returns {string} The piece in FEN notation
 */
const pieceToFEN = (piece) => {
  if (!piece) return '';
  const color = piece.charAt(0);
  const type = piece.charAt(1);
  const fenPieces = {
    'p': 'p',
    'r': 'r',
    'n': 'n',
    'b': 'b',
    'q': 'q',
    'k': 'k'
  };
  return color === 'w' ? fenPieces[type].toUpperCase() : fenPieces[type];
};

/**
 * Converts the chess board to FEN notation
 * @param {Array<Array<string>>} board - 2D array representing the chess board
 * @returns {string} FEN notation of the current board position
 */
export const boardToFEN = (board) => {
  let fen = '';
  
  // Process each row
  for (let row = 0; row < 8; row++) {
    let emptySquares = 0;
    
    // Process each column in the row
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece) {
        // If we had empty squares before this piece, add the count
        if (emptySquares > 0) {
          fen += emptySquares;
          emptySquares = 0;
        }
        fen += pieceToFEN(piece);
      } else {
        emptySquares++;
      }
    }
    
    // Add any remaining empty squares at the end of the row
    if (emptySquares > 0) {
      fen += emptySquares;
    }
    
    // Add row separator (/) except for the last row
    if (row < 7) {
      fen += '/';
    }
  }
  
  // Add additional FEN components (active color, castling, en passant, etc.)
  // For now, we'll use placeholder values
  fen += ' w - - 0 1';
  
  return fen;
};