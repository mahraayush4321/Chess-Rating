import { ML_API } from '../config/api';

/**
 * Sends game moves to the ML API for analysis
 * @param {Object} gameData - The game data containing moves and metadata
 * @returns {Promise<Object>} Analysis results from the ML API
 */
export const analyzeMoves = async (gameData) => {
    try {
        const response = await fetch(`${ML_API.BASE_URL}${ML_API.ENDPOINTS.ANALYZE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify(gameData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Analysis API error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const analysis = await response.json();
        return analysis;
    } catch (error) {
        console.error('ML Analysis Error:', error);
        throw error;
    }
};

/**
 * Tests the connection to the ML API
 * @returns {Promise<Object>} Test response from the ML API
 */
export const testAnalyzeAPI = async () => {
    try {
        const testData = {
            moves: [
                {
                    piece: "wp",
                    from: "e2",
                    to: "e4",
                    player: "white",
                    timestamp: new Date().toISOString()
                }
            ],
            gameMetadata: {
                totalMoves: 1,
                gameDuration: 30,
                timeControl: 300,
                result: "ongoing"
            },
            players: {
                white: {
                    id: "test_player_1",
                    rating: 1500
                },
                black: {
                    id: "test_player_2",
                    rating: 1500
                }
            }
        };
        
        const response = await fetch(`${ML_API.BASE_URL}${ML_API.ENDPOINTS.ANALYZE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify(testData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response not OK:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const analysis = await response.json();
        console.log('API Test Response:', analysis);
        return analysis;
    } catch (error) {
        console.error('API Test Error:', error);
        throw error;
    }
};