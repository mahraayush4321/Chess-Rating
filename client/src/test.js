// Using fetch API for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ML_API = {
    BASE_URL: 'https://chess-analyzer-api-production.up.railway.app/api',
    ENDPOINTS: {
        ANALYZE: '/analyze'
    }
};

const testAPI = async () => {
    try {
        const response = await fetch(`${ML_API.BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                moves: [{
                    piece: "wp",
                    from: "e2",
                    to: "e4",
                    player: "white"
                }]
            })
        });
        
        console.log('Status:', response.status);
        const data = await response.text();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

testAPI();