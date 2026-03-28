const axios = require('axios');

async function testAPI() {
    try {
        console.log('Testing GET /api/tiers-classes...');
        // We use localhost:3066 because it's the PORT in .env
        const response = await axios.get('http://localhost:3066/api/tiers-classes');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testAPI();
