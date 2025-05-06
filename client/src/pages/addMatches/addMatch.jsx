import React, { useState, useEffect } from 'react';
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";

const AddMatch = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [suitableOpponents, setSuitableOpponents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        fetchSuitableOpponents(user._id);
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    }
  }, []);

  const fetchSuitableOpponents = async (userId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/getPlayers`);
      if (!response.ok) {
        throw new Error('Failed to fetch opponents');
      }
      const responseData = await response.json();
      
      if (!responseData.data || !responseData.data.players) {
        throw new Error('Invalid response format');
      }

      const opponents = responseData.data.players
        .filter(player => player._id !== userId)
        .map(player => ({
          id: player._id,
          name: player.name,
          rating: player.rating,
          ratingDifference: Math.abs(player.rating - currentUser.rating)
        }));
      setSuitableOpponents(opponents);
    } catch (error) {
      console.error('Error fetching opponents:', error);
    }
  };

  const findMatch = async () => {
    setIsSearching(true);
    try {
      await fetchSuitableOpponents(currentUser._id);
    } catch (error) {
      console.error('Error finding match:', error);
    }
    setIsSearching(false);
  };

  const startMatch = async (opponent) => {
    setSelectedOpponent(opponent);
  };

  const confirmMatch = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/v1/addMatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1: currentUser._id,
          player2: selectedOpponent.id,
          result: 'ongoing',
          datePlayed: new Date()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Match started:', data);
        setSelectedOpponent(null);
        fetchSuitableOpponents(currentUser._id);
      } else {
        console.error('Failed to start match');
      }
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Chess Match Center</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player Stats Card */}
          <Card className="bg-zinc-800/60 border border-zinc-700 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-zinc-300">
                <p>Name: {currentUser?.firstName} {currentUser?.lastName}</p>
                <p>Rating: {currentUser?.rating || 1200}</p>
              </div>
              <Button
                onClick={findMatch}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition"
                disabled={isSearching}
              >
                {isSearching ? 'Finding Opponents...' : 'Find Match'}
              </Button>
            </CardContent>
          </Card>

          {/* Match History Card */}
          <Card className="bg-zinc-800/60 border border-zinc-700 shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 italic">No recent matches.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Available Opponents */}
      {suitableOpponents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Available Opponents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suitableOpponents.map((opponent) => (
              <Card key={opponent.id} className="bg-zinc-800/60 border border-zinc-700 shadow-lg rounded-xl">
                <CardContent className="p-4">
                  <div className="text-zinc-300">
                    <p className="font-bold text-white">{opponent.name}</p>
                    <p>Rating: {opponent.rating}</p>
                    <p>Rating Difference: {opponent.ratingDifference}</p>
                  </div>
                  <Button
                    onClick={() => startMatch(opponent)}
                    className="mt-4 w-full bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 transition"
                  >
                    Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Match Setup Modal */}
      {selectedOpponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 bg-zinc-800/90 border border-zinc-700 shadow-2xl rounded-xl">
            <CardHeader>
              <CardTitle className="text-white">Match Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4">
                Starting match with {selectedOpponent.name}
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => setSelectedOpponent(null)}
                  variant="outline"
                  className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                  onClick={confirmMatch}
                >
                  Start Match
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AddMatch;