const axios = require('axios');

async function testListAPI() {
    try {
        console.log('Testing GET /api/tiers...');
        const response = await axios.get('http://localhost:3066/api/tiers?sort=recent');
        console.log('Status:', response.status);
        const firstClient = response.data.data?.[0];
        if (firstClient) {
            console.log('First Client Name:', firstClient.Raisoc);
            console.log('First Client Classe (ID):', firstClient.Classe);
            console.log('First Client tiersClasse:', JSON.stringify(firstClient.tiersClasse, null, 2));
        } else {
            console.log('No clients found.');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testListAPI();
