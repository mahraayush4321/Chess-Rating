// Chess piece Unicode symbols
export const pieces = {
  'white': { 'king': '♔', 'queen': '♕', 'rook': '♖', 'bishop': '♗', 'knight': '♘', 'pawn': '♙' },
  'black': { 'king': '♚', 'queen': '♛', 'rook': '♜', 'bishop': '♝', 'knight': '♞', 'pawn': '♟' }
};

// Initial board setup
export const initialBoard = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
];

// Convert piece code to Unicode symbol
export const getPieceSymbol = (code) => {
  if (!code) return '';
  const color = code[0] === 'w' ? 'white' : 'black';
  let type;
  switch(code[1]) {
    case 'k': type = 'king'; break;
    case 'q': type = 'queen'; break;
    case 'r': type = 'rook'; break;
    case 'b': type = 'bishop'; break;
    case 'n': type = 'knight'; break;
    case 'p': type = 'pawn'; break;
    default: return '';
  }
  return pieces[color][type];
};

// Get piece color
export const getPieceColor = (code) => {
  if (!code) return null;
  return code[0] === 'w' ? 'white' : 'black';
};

// Validate piece movement
export const isValidMove = (board, fromRow, fromCol, toRow, toCol, currentPlayer) => {
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  
  const pieceType = piece[1];
  const isWhite = piece[0] === 'w';
  
  // Basic validation: can't capture own pieces
  if (board[toRow][toCol] && board[toRow][toCol][0] === piece[0]) return false;

  switch (pieceType) {
    case 'p': return isValidPawnMove(board, fromRow, fromCol, toRow, toCol, isWhite);
    case 'r': return isValidRookMove(board, fromRow, fromCol, toRow, toCol);
    case 'n': return isValidKnightMove(fromRow, fromCol, toRow, toCol);
    case 'b': return isValidBishopMove(board, fromRow, fromCol, toRow, toCol);
    case 'q': return isValidQueenMove(board, fromRow, fromCol, toRow, toCol);
    case 'k': return isValidKingMove(fromRow, fromCol, toRow, toCol);
    default: return false;
  }
};

const isValidPawnMove = (board, fromRow, fromCol, toRow, toCol, isWhite) => {
  const direction = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  
  // Basic forward movement
  if (fromCol === toCol && !board[toRow][toCol]) {
    // Single square movement
    if (toRow === fromRow + direction) return true;
    
    // Double square movement from starting position
    if (fromRow === startRow && 
        toRow === fromRow + 2 * direction && 
        !board[fromRow + direction][fromCol]) {
      return true;
    }
  }
  
  // Capture movement
  if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction) {
    return board[toRow][toCol] && board[toRow][toCol][0] !== (isWhite ? 'w' : 'b');
  }
  
  return false;
};

const isValidRookMove = (board, fromRow, fromCol, toRow, toCol) => {
  if (fromRow !== toRow && fromCol !== toCol) return false;
  
  const rowDir = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
  const colDir = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
  
  // Check path for obstacles
  let currentRow = fromRow + rowDir;
  let currentCol = fromCol + colDir;
  
  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol]) return false;
    currentRow += rowDir;
    currentCol += colDir;
  }
  
  return true;
};

const isValidKnightMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
};

const isValidBishopMove = (board, fromRow, fromCol, toRow, toCol) => {
  if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
  
  const rowDir = toRow > fromRow ? 1 : -1;
  const colDir = toCol > fromCol ? 1 : -1;
  
  // Check path for obstacles
  let currentRow = fromRow + rowDir;
  let currentCol = fromCol + colDir;
  
  while (currentRow !== toRow && currentCol !== toCol) {
    if (board[currentRow][currentCol]) return false;
    currentRow += rowDir;
    currentCol += colDir;
  }
  
  return true;
};

const isValidQueenMove = (board, fromRow, fromCol, toRow, toCol) => {
  return isValidRookMove(board, fromRow, fromCol, toRow, toCol) || 
         isValidBishopMove(board, fromRow, fromCol, toRow, toCol);
};

const isValidKingMove = (fromRow, fromCol, toRow, toCol) => {
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  return rowDiff <= 1 && colDiff <= 1;
};
