import { ML_API } from '../config/api';

export const analyzeMoves = async (gameData) => {
    try {
        const response = await fetch(`${ML_API.BASE_URL}${ML_API.ENDPOINTS.MOVE_ANALYSIS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ML_API.API_KEY}`,
                'X-API-Version': '1.0'
            },
            body: JSON.stringify(gameData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const analysis = await response.json();
        return analysis;
    } catch (error) {
        console.error('ML Analysis Error:', error);
        throw error;
    }
};