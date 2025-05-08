import Header from '../components/Header';
import React, { useState, useEffect } from 'react';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchPlayers = async () => {
      // Placeholder data
      const dummyData = [
        { rank: 1, name: "Hikaru", rating: 3331, won: 32108, draw: 4021, lost: 5156 },
        { rank: 2, name: "MagnusCarlsen", rating: 3272, won: 3681, draw: 643, lost: 798 },
        { rank: 3, name: "LyonBeast", rating: 3235, won: 2053, draw: 498, lost: 738 },
        // Add more players as needed
      ];
      setPlayers(dummyData);
      
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(user);
    };

    fetchPlayers();
  }, []);

  return (
    <>
    <Header />
    <div className="min-h-screen bg-zinc-900 p-6 flex">
      {/* Main Leaderboard Table */}
      <div className="flex-1 mr-6">
        <div className="bg-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-700">
              <tr className="text-left text-gray-300">
                <th className="p-4">Player</th>
                <th className="p-4">Rating</th>
                <th className="p-4 text-green-500">Won</th>
                <th className="p-4 text-gray-400">Draw</th>
                <th className="p-4 text-red-500">Lost</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.rank} className="border-b border-zinc-700 hover:bg-zinc-700/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">#{player.rank}</span>
                      <div className="w-8 h-8 bg-zinc-600 rounded-full"></div>
                      <span className="text-white">{player.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white">{player.rating}</td>
                  <td className="p-4 text-green-500">{player.won}</td>
                  <td className="p-4 text-gray-400">{player.draw}</td>
                  <td className="p-4 text-red-500">{player.lost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Sidebar - Player Stats */}
      <div className="w-80">
        <div className="bg-zinc-800 rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-zinc-700 rounded-lg mx-auto mb-4">
              <img 
                src="/chess-pawn.svg" 
                alt="Profile" 
                className="w-full h-full p-4"
              />
            </div>
            <h2 className="text-white text-xl mb-1">{currentUser?.username || 'DOKO2K'}</h2>
            <div className="text-4xl font-bold text-white mb-6">
              {currentUser?.rating || '400'}
            </div>

            {/* Stats */}
            <div className="space-y-4 text-left">
              <div className="flex justify-between">
                <span className="text-gray-400">Rating</span>
                <span className="text-white">{currentUser?.rating || '400'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Players</span>
                <span className="text-white">22,915,711</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Rating</span>
                <span className="text-white">634.73</span>
              </div>
              <button className="w-full mt-4 flex items-center justify-between text-gray-400 hover:text-white transition">
                <span>Live Stats</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};

export default Leaderboard;
