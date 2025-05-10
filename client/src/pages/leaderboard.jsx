import Header from '../components/Header';
import React, { useState, useEffect } from 'react';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leaderboard data
        const leaderboardResponse = await fetch('https://chess-rating.onrender.com/api/v1/leaderboard');
        if (!leaderboardResponse.ok) throw new Error('Failed to fetch leaderboard');
        const leaderboardData = await leaderboardResponse.json();
        
        // Sort and set players
        const sortedPlayers = leaderboardData.leaderboard.sort((a, b) => b.rating - a.rating);
        setPlayers(sortedPlayers);

        // Get current user from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData?._id) {
          setCurrentUser(userData);
          
          // Fetch detailed user stats
          const userResponse = await fetch(`https://chess-rating.onrender.com/api/v1/${userData._id}`);
          if (!userResponse.ok) throw new Error('Failed to fetch user stats');
          const userDataDetailed = await userResponse.json();
          setUserStats(userDataDetailed);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-zinc-900 p-4 flex justify-center items-center">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </>
    );
  }

  // Helper functions
  const getCurrentUserRank = () => {
    if (!currentUser) return 'Unranked';
    const index = players.findIndex(p => p.userId === currentUser._id);
    return index >= 0 ? `#${index + 1}` : 'Unranked';
  };

  const calculateWinRate = (wins, total) => {
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Main Leaderboard Table */}
          <div className="w-full lg:flex-1">
            <h1 className="text-2xl font-bold text-white mb-4">Top Players</h1>
            <div className=" rounded-lg overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-zinc-700">
                  <tr className="text-left text-gray-300">
                    <th className="p-3 sm:p-4">Rank</th>
                    <th className="p-3 sm:p-4">Player</th>
                    <th className="p-3 sm:p-4">Rating</th>
                    <th className="p-3 sm:p-4 hidden sm:table-cell">Wins</th>
                    <th className="p-3 sm:p-4 hidden sm:table-cell">Draws</th>
                    <th className="p-3 sm:p-4 hidden sm:table-cell">Losses</th>
                    <th className="p-3 sm:p-4">Matches</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr 
                      key={player._id} 
                      className={`border-b border-zinc-700 hover:bg-zinc-700/50 ${
                        currentUser && currentUser._id === player.userId ? 'bg-blue-900/30' : ''
                      }`}
                    >
                      <td className="p-3 sm:p-4 text-gray-400">#{index + 1}</td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-fuchsia-300 rounded-full flex items-center justify-center text-xs sm:text-base">
                            {player.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span className="text-white text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">
                              {player.name || 'Anonymous'}
                            </span>
                            {player.country && player.country !== 'Unknown' && (
                              <span className="text-xs text-gray-400 hidden sm:inline">
                                {player.country}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-white font-mono">{player.rating || 0}</td>
                      <td className="p-3 sm:p-4 text-green-500 hidden sm:table-cell">{player.wins || 0}</td>
                      <td className="p-3 sm:p-4 text-yellow-500 hidden sm:table-cell">{player.draws || 0}</td>
                      <td className="p-3 sm:p-4 text-red-500 hidden sm:table-cell">{player.losses || 0}</td>
                      <td className="p-3 sm:p-4 text-gray-300">{player.totalMatches || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar - Player Stats */}
          <div className="w-full lg:w-80">
            <div className=" rounded-lg p-4 lg:sticky lg:top-4">
              <h2 className="text-xl text-white mb-4">Your Stats</h2>
              
              {currentUser ? (
                <>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl text-white">
                        {currentUser.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <h2 className="text-white text-lg sm:text-xl mb-1 truncate">
                      {currentUser.firstName|| 'Player'}
                    </h2>
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-4">
                      {userStats?.rating || currentUser.rating || 'Unrated'}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-700/50 p-3 rounded">
                      <div className="text-gray-400 text-sm">Rank</div>
                      <div className="text-white font-medium">{getCurrentUserRank()}</div>
                    </div>
                    <div className="bg-zinc-700/50 p-3 rounded">
                      <div className="text-gray-400 text-sm">Matches</div>
                      <div className="text-white font-medium">{userStats?.totalMatches || 0}</div>
                    </div>
                    <div className="bg-zinc-700/50 p-3 rounded">
                      <div className="text-gray-400 text-sm">Win Rate</div>
                      <div className="text-white font-medium">
                        {calculateWinRate(userStats?.wins || 0, userStats?.totalMatches || 1)}%
                      </div>
                    </div>
                    <div className="bg-zinc-700/50 p-3 rounded">
                      <div className="text-gray-400 text-sm">Streak</div>
                      <div className={`font-medium ${
                        (userStats?.streak || 0) > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {userStats?.streak || 0}
                      </div>
                    </div>
                  </div>

                  {/* Recent Matches */}
                  {userStats?.matches?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-gray-300 text-sm font-medium mb-2">Recent Matches</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userStats.matches.slice(0, 3).map(match => (
                          <div key={match._id} className="bg-zinc-700/30 p-2 rounded text-sm">
                            <div className="flex justify-between">
                              <span className="text-white truncate">
                                vs {match.player1._id === currentUser._id ? match.player2.name : match.player1.name}
                              </span>
                              <span className={`font-medium ${
                                match.result === 'win' ? 'text-green-500' : 
                                match.result === 'loss' ? 'text-red-500' : 'text-yellow-500'
                              }`}>
                                {match.result}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-xs">
                              <span>{new Date(match.datePlayed).toLocaleDateString()}</span>
                              <span>{match.timeControl / 60} min</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Not logged in</p>
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    onClick={() => {/* Add login navigation here */}}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Leaderboard;