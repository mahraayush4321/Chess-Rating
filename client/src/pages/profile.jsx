import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);

    // TODO: Fetch game history from your API
    // This is a placeholder game history
    setGameHistory([
      {
        id: 1,
        opponent: "Heratar",
        result: "0-1",
        moves: 27,
        accuracy: 70.6,
        date: "May 7, 2025",
        duration: "10 min"
      }
    ]);
  }, []);

  return (
    <>
        <Header />
    <div className="min-h-screen bg-zinc-900 p-6">
      {/* Profile Header */}
      <div className="bg-zinc-800 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-6">
          {/* Profile Image */}
          <div className="w-32 h-32 bg-zinc-700 rounded-lg">
            <img 
              src="/chess-pawn.svg" 
              alt="Profile" 
              className="w-full h-full p-4"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-2xl font-bold text-white">
                {user?.username || 'Username'}
              </h1>
              <span className="px-3 py-1 bg-zinc-700 rounded-full text-sm text-gray-300">
                Add flair
              </span>
            </div>
            <p className="text-gray-400 mb-4">Enter a status here</p>
            <div className="flex gap-6 text-sm text-gray-400">
              <span>Joined {user?.joinDate || 'May 7, 2025'}</span>
              <span>0 Friends</span>
              <span>0 Views</span>
              <span className="text-green-500">Online now</span>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600 transition">
            Edit Profile
          </button>
        </div>
      </div>


{/* Game History and League Info Row */}
<div className="flex flex-col md:flex-row w-full gap-6 mb-8">
  {/* Game History Section */}
  <div className="bg-zinc-800 rounded-lg p-6 flex-grow">
    <h2 className="text-xl text-white mb-4">Game History (1)</h2>
    <table className="w-full text-gray-300">
      <thead>
        <tr className="text-left">
          <th className="pb-4">Players</th>
          <th className="pb-4">Result</th>
          <th className="pb-4">Accuracy</th>
          <th className="pb-4">Moves</th>
          <th className="pb-4">Date</th>
        </tr>
      </thead>
      <tbody>
        {gameHistory.map(game => (
          <tr key={game.id} className="border-t border-zinc-700">
            <td className="py-4">{game.opponent}</td>
            <td className="py-4">{game.result}</td>
            <td className="py-4">{game.accuracy}%</td>
            <td className="py-4">{game.moves}</td>
            <td className="py-4">{game.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* League Info - Right Side */}
  <div className="bg-zinc-800 rounded-lg p-6 w-full md:w-80">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl text-white">Genegrate Report</h2>
      <span className="text-gray-400">ⓘ</span>
    </div>
    <div className="flex justify-between items-center mb-4">
      <span className="text-gray-400">Position</span>
      <span className="text-white text-2xl">#37</span>
    </div>
    <div className="flex justify-between items-center mb-6">
      <span className="text-gray-400">Trophies</span>
      <span className="text-white text-2xl">0</span>
    </div>
    <button className="w-full text-center text-gray-400 hover:text-white transition">
      See Your Division →
    </button>
  </div>
</div>
    </div>
    </>
  );
};

export default Profile;
