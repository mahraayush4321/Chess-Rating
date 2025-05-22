import React from 'react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { getPieceSymbol } from '../utils/chess';
import { Pie } from 'react-chartjs-2';
import { useChessGame } from '../utils/chess/useChessGame';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const PlayPage = () => {
  const {
    // Game state
    board,
    currentPlayer,
    playerColor,
    selectedPiece,
    lastMove,
    gameOver,
    winner,
    errorMessage,
    isKingInCheck,
    
    // Match state
    matchDetails,
    opponentInfo,
    isPlayerReady,
    bothPlayersReady,
    isSearching,
    
    // Timers
    whiteTime,
    blackTime,
    
    // UI state
    showTurnAlert,
    analysisData,
    showAnalysis,
    activeTab,
    moveHistory,
    
    // Utility functions
    formatTime,
    getDisplayBoard,
    getPieceColor,
    
    // Actions
    setActiveTab,
    handleSquareClick,
    startSearching,
    cancelSearching,
    markPlayerReady,
    handleResign,
    resetGame,
    navigate
  } = useChessGame();

  const renderGameStatus = () => {
    if (isSearching) {
      return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in-up space-y-6">
            <div className="flex justify-center">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
                <div className="relative flex items-center justify-center h-full w-full">
                  <svg className="h-10 w-10 text-purple-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
              Searching for opponent...
            </h2>
            <p className="text-zinc-400 text-sm text-center">Looking for players with similar rating...</p>
            <Button
              onClick={cancelSearching}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl"
            >
              Cancel Search
            </Button>
          </div>
        </div>
      );
    }
  
    if (matchDetails && !isPlayerReady) {
      return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full opacity-20 animate-pulse"></div>
                <div className="relative flex items-center justify-center h-full w-full">
                  <svg className="h-16 w-16 text-green-400 animate-bounce" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
  
            <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
              Opponent Found!
            </h2>
  
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <span className="text-zinc-300 font-medium">Opponent:</span>
                <span className="font-bold text-white">{opponentInfo?.name || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <span className="text-zinc-300 font-medium">Rating:</span>
                <span className="font-bold text-emerald-400">{opponentInfo?.rating || '?'}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <span className="text-zinc-300 font-medium">You play as:</span>
                <span className={`px-3 py-1 rounded-full font-bold ${playerColor === 'white' ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white border border-zinc-700'}`}>
                  {playerColor === 'white' ? 'White ♔' : 'Black ♚'}
                </span>
              </div>
            </div>
  
            <Button
              onClick={markPlayerReady}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl"
            >
              Ready to Play
            </Button>
          </div>
        </div>
      );
    }
  
    if (matchDetails && isPlayerReady && !bothPlayersReady) {
      return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in-up text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="relative flex items-center justify-center h-full w-full">
                  <svg className="h-10 w-10 text-amber-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text">
              Waiting for opponent...
            </h2>
            <p className="text-zinc-400 text-sm">Your opponent needs to confirm they're ready</p>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      );
    }
  
    if (!matchDetails && !isSearching) {
      return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in-up space-y-6 text-center">
            <div className="flex justify-center">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-600 rounded-full opacity-20 animate-pulse"></div>
                <div className="relative flex items-center justify-center h-full w-full">
                  <svg
                    className="h-10 w-10 text-purple-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 010 5.656l-1.415 1.414a4 4 0 01-5.657 0l-1.414-1.414a4 4 0 010-5.657m6.364-6.364a4 4 0 015.657 0l1.414 1.414a4 4 0 010 5.657l-1.414 1.415a4 4 0 01-5.657 0"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
              Connecting with your opponent...
            </h2>
            <p className="text-zinc-400 text-sm">
              Establishing connection, please wait
            </p>
          </div>
        </div>
      );
    }
  
    return null;
  };
  

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
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

      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {renderGameStatus()}

        {matchDetails && bothPlayersReady && (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Panel - Game Info */}
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

              <Button
                onClick={handleResign}
                variant="outline"
                className="w-full mt-2 border-red-500 text-red-500 hover:bg-red-50"
                disabled={!bothPlayersReady || gameOver}
              >
                Resign
              </Button>
            </div>

            {/* Center Panel - Chess Board */}
            <div className="flex-1">
              {/* Game Status Messages */}
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

              {/* Chess Board */}
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

              {/* Mobile Info Panel */}
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

      {/* Game Over Dialog */}
      <AlertDialog open={gameOver}>
        <AlertDialogContent className="max-w-2xl mx-2 sm:mx-auto bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              {winner === playerColor
                ? "Victory!"
                : winner === null
                ? "Draw"
                : "Game Over"}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="py-4">
            <div className="text-center mb-6 bg-white p-4 rounded-lg shadow-sm">
              {winner === playerColor ? (
                <>
                  <p className="text-green-600 text-lg font-semibold mb-2">
                    Congratulations! You Won!
                  </p>
                  <p className="text-gray-900 font-medium">
                    New Rating: {opponentInfo?.rating || 0}
                    {opponentInfo?.rating && opponentInfo?.initialRating && (
                      <span>
                        (
                        {opponentInfo.rating - opponentInfo.initialRating > 0
                          ? "+"
                          : ""}
                        {opponentInfo.rating - opponentInfo.initialRating})
                      </span>
                    )}
                  </p>
                </>
              ) : winner === null ? (
                <p className="text-gray-900 font-medium">
                  The game ended in a draw!
                </p>
              ) : (
                <>
                  <p className="text-orange-600 text-lg font-semibold mb-2">
                    Better luck next time!
                  </p>
                  <p className="text-gray-900 font-medium">
                    New Rating: {opponentInfo?.rating || 0}
                    {opponentInfo?.rating && opponentInfo?.initialRating && (
                      <span>
                        (
                        {opponentInfo.rating - opponentInfo.initialRating > 0
                          ? "+"
                          : ""}
                        {opponentInfo.rating - opponentInfo.initialRating})
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>
            {moveHistory?.length > 0 ? (
              !analysisData ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">
                    Analyzing your game...
                  </p>
                </div>
              ) : (
                <>
                  {/* Tab buttons */}
                  <div className="flex space-x-2 mb-4">
                    {["overview", "moves", "suggestions"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          activeTab === tab
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="space-y-4">
                    {activeTab === "overview" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg shadow">
                          <h3 className="text-sm font-semibold mb-2">
                            Move Quality
                          </h3>
                          <Pie
                            data={{
                              labels: [
                                "Accurate",
                                "Inaccuracies",
                                "Mistakes",
                                "Blunders",
                              ],
                              datasets: [
                                {
                                  data: [
                                    analysisData.total_moves -
                                      (analysisData.inaccuracies +
                                        analysisData.mistakes +
                                        analysisData.blunders),
                                    analysisData.inaccuracies,
                                    analysisData.mistakes,
                                    analysisData.blunders,
                                  ],
                                  backgroundColor: [
                                    "#4ade80",
                                    "#facc15",
                                    "#fb923c",
                                    "#f87171",
                                  ],
                                },
                              ],
                            }}
                            options={{
                              plugins: {
                                legend: {
                                  position: "bottom",
                                  labels: { boxWidth: 10 },
                                },
                              },
                            }}
                          />
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow">
                          <h3 className="text-sm font-semibold mb-2">
                            Statistics
                          </h3>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500">Accuracy</p>
                              <p className="text-lg font-semibold">
                                {analysisData.accuracy.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Total Moves
                              </p>
                              <p className="text-lg font-semibold">
                                {analysisData.total_moves}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "moves" && (
                      <div className="bg-white p-3 rounded-lg shadow">
                        <h3 className="text-sm font-semibold mb-2">
                          Critical Moments
                        </h3>
                        <div className="space-y-2">
                          {analysisData.worst_moves.map((move, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                Move {move["Move Number"]}: {move.Move}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  move.Classification === "Blunder"
                                    ? "bg-red-100 text-red-700"
                                    : move.Classification === "Mistake"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {move.Classification}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "suggestions" && (
                      <div className="bg-white p-3 rounded-lg shadow">
                        <h3 className="text-sm font-semibold mb-2">
                          Improvement Suggestions
                        </h3>
                        <ul className="list-disc pl-4 space-y-1">
                          {analysisData.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                resetGame();
                navigate("/home");
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
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