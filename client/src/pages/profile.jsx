import Header from '../components/Header';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const predefinedAvatars = [
  '/avatar1.jpg',
  '/avatar2.jpg',
  '/avatar3.jpg',
  '/avatar4.jpg',
  '/avatar5.jpg'
];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    bio: ''
  });
  const navigate = useNavigate();
 

  const calculateStreak = (matches, userId) => {
    if (!matches || matches.length === 0) return 0;
    let currentStreak = 0;
    
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(b.datePlayed) - new Date(a.datePlayed)
    );
    
    const firstMatch = sortedMatches.find(match => match.status === 'completed');
    if (!firstMatch) return 0;
    
    const isFirstMatchWin = (firstMatch.player1._id === userId && firstMatch.result === 'win') || 
                           (firstMatch.player2._id === userId && firstMatch.result === 'loss');
    
    for (const match of sortedMatches) {
      if (match.status !== 'completed') continue;
      
      const isWin = (match.player1._id === userId && match.result === 'win') || 
                   (match.player2._id === userId && match.result === 'loss');
                   
      if (isWin === isFirstMatchWin) {
        currentStreak += isFirstMatchWin ? 1 : -1;
      } else {
        break;
      }
    }
    
    return currentStreak;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?._id) return;

        const response = await fetch(`https://chess-rating.onrender.com/api/v1/${userData._id}`);
        const data = await response.json();
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
          setPreviewUrl(savedAvatar);
        } else if (data.profilePicture) {
          setPreviewUrl(data.profilePicture);
        }
        setUser(data);
        setEditForm({
          name: data.name || '',
          bio: data.bio || ''
        });
        
        if (data.matches) {
          const streak = calculateStreak(data.matches, userData._id);
          setUser(prev => ({ ...prev, currentStreak: streak }));
          const transformedHistory = data.matches.map(match => {
            const isPlayer1 = match.player1._id === userData._id;
            const opponent = isPlayer1 ? match.player2 : match.player1;
            
            let result;
            if (match.result === 'draw') {
              result = 'Draw';
            } else if (match.result === 'win') {
              result = isPlayer1 ? 'Win' : 'Loss';
            } else {
              result = isPlayer1 ? 'Loss' : 'Win';
            }
            
            return {
              id: match._id,
              opponent: opponent.name || 'Unknown Player',
              result: result,
              moves: match.moves?.length || '-',
              date: new Date(match.datePlayed).toLocaleDateString(),
              duration: match.duration ? `${match.duration}s` : 'NaN min'
            };
          });
          
          setGameHistory(transformedHistory);
        }
  
        if (data.profilePicture) {
          setPreviewUrl(data.profilePicture);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);
      
      const response = await fetch(`https://chess-rating.onrender.com/api/v1/upload-profile/${user._id}`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setShowUploadModal(false);
      }
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    try {
      const response = await fetch(`https://chess-rating.onrender.com/api/v1/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setShowEditModal(false);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

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

  return (
    <>
      <Header />
      <div className="min-h-screen mt-10 bg-black p-4 md:p-8">
        {/* Profile Header */}
        <div className="bg-black rounded-xl p-6 mb-8 shadow-2xl border border-gray-700 backdrop-blur-sm bg-opacity-80">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Profile Image */}
            <div className="relative group w-32 h-32 md:w-40 md:h-40">
              <div className="w-full h-full rounded-xl shadow-lg overflow-hidden border-2 border-amber-500/30">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-amber-500/70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text ">
                  {user?.name || "Username"}
                </h1>
                <div className="flex gap-3">
                  <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Rating: {user?.rating || 1200}
                  </span>
                  <span className="px-3 py-1 bg-green-900/30 rounded-full text-sm text-green-400 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                      />
                    </svg>
                    Online
                  </span>
                </div>
              </div>

              <div className="relative group">
                <p
                  className="text-gray-400 mb-4 italic cursor-pointer hover:bg-gray-700/30 rounded-lg p-2 transition-colors"
                  onClick={() => setShowEditModal(true)}
                >
                  {user?.bio || "No bio set. Click to edit..."}
                </p>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mt-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="bg-gray-700/50 px-4 py-2 rounded-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <span className="text-white font-medium">
                    {user?.wins || 0}
                  </span>
                  <span className="text-gray-400 ml-1">Wins</span>
                </div>

                <div className="bg-gray-700/50 px-4 py-2 rounded-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-white font-medium">
                    {user?.losses || 0}
                  </span>
                  <span className="text-gray-400 ml-1">Losses</span>
                </div>

                <div className="bg-gray-700/50 px-4 py-2 rounded-lg flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="text-white font-medium">
                    {user?.draws || 0}
                  </span>
                  <span className="text-gray-400 ml-1">Draws</span>
                </div>
              </div>
            </div>

            {/* Stats Display */}
            <div className="bg-black p-4 rounded-xl shadow-lg border border-gray-600 w-full md:w-48">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">
                  {user?.rating || 1200}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">
                  Current Rating
                </div>
                <div className="mt-3 flex justify-center">
                  {/* <div className="text-sm px-3 py-1 bg-gray-600/50 rounded-full text-amber-300 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {user?.ratingChange || 0}
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game History and Stats Row */}
        <div className="flex flex-col lg:flex-row w-full gap-6 mb-8">
          {/* Game History Section */}
          <div className="bg-black rounded-xl p-6 flex-grow shadow-xl border border-gray-700 backdrop-blur-sm bg-opacity-80">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Game History{" "}
                <span className="text-amber-400">({gameHistory.length})</span>
              </h2>
              <button className="text-gray-400 hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
            </div>

            {gameHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-gray-300">
                  <thead>
                    <tr className="text-left border-b border-gray-700">
                      <th className="pb-4 px-4 font-medium text-gray-400">
                        Opponent
                      </th>
                      <th className="pb-4 px-4 font-medium text-gray-400">
                        Result
                      </th>
                      <th className="pb-4 px-4 font-medium text-gray-400">
                        Moves
                      </th>
                      <th className="pb-4 px-4 font-medium text-gray-400">
                        Date
                      </th>
                      <th className="pb-4 px-4 font-medium text-gray-400">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameHistory.map((game, index) => (
                      <tr
                        key={game.id}
                        className={`border-t border-gray-700 hover:bg-gray-700/30 transition-colors ${
                          index % 2 === 0 ? "bg-gray-800/50" : ""
                        }`}
                      >
                        <td className="py-4 px-4 font-medium text-white">
                          {game.opponent}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              game.result === "Win"
                                ? "bg-green-900/30 text-green-400"
                                : game.result === "Loss"
                                ? "bg-red-900/30 text-red-400"
                                : "bg-yellow-900/30 text-yellow-400"
                            }`}
                          >
                            {game.result}
                          </span>
                        </td>
                        <td className="py-4 px-4">{game.moves}</td>
                        <td className="py-4 px-4 text-gray-400">{game.date}</td>
                        <td className="py-4 px-4">{game.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg text-gray-300 mb-2">
                  No games played yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Challenge opponents and your game history will appear here
                </p>
                <button
                  onClick={() => navigate("/home")}
                  className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white font-medium transition-colors"
                >
                  Find Opponent
                </button>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="bg-black rounded-xl p-6 w-full lg:w-80 shadow-xl border border-gray-700 backdrop-blur-sm bg-opacity-80">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Statistics
              </h2>
              <button className="text-gray-400 hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Total Games</span>
                  <span className="text-white font-bold">
                    {user?.totalMatches || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-white font-bold">
                    {user?.totalMatches
                      ? ((user.wins / user.totalMatches) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        user?.totalMatches
                          ? (user.wins / user.totalMatches) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Current Streak</span>
                  <span className="text-white font-bold">
                    {user?.currentStreak ? Math.abs(user.currentStreak) : 0}
                    {user?.currentStreak
                      ? user.currentStreak > 0
                        ? " Wins"
                        : " Losses"
                      : ""}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      user?.currentStreak > 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.abs(user?.currentStreak || 0) * 10,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  Performance
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-700/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {user?.wins || 0}
                    </div>
                    <div className="text-xs text-gray-400">Wins</div>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">
                      {user?.losses || 0}
                    </div>
                    <div className="text-xs text-gray-400">Losses</div>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">
                      {user?.draws || 0}
                    </div>
                    <div className="text-xs text-gray-400">Draws</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Choose Profile Picture
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {predefinedAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setPreviewUrl(avatar);
                    localStorage.setItem("userAvatar", avatar);
                    setShowUploadModal(false);
                    setUser((prev) => ({
                      ...prev,
                      profilePicture: avatar,
                    }));
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    previewUrl === avatar
                      ? "border-amber-500 scale-105"
                      : "border-gray-600 hover:border-amber-500/50"
                  }`}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-gray-400 text-sm mb-2"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full bg-black rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>

              <div>
                <label
                  className="block text-gray-400 text-sm mb-2"
                  htmlFor="bio"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  rows="3"
                  className="w-full bg-black rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;