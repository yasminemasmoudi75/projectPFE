#!/usr/bin/env node

const axios = require('axios');

async function testObjectivesAPI() {
    try {
        console.log('Testing /api/objectifs endpoint...');
        
        // Make request to the API
        const response = await axios.get('http://localhost:3066/api/objectifs', {
            params: {
                mois: 5,
                annee: 2026,
                statut: 'actif'
            },
            headers: {
                'Cookie': 'token=test'
            },
            validateStatus: () => true // Don't throw on any status code
        });

        console.log('Status Code:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
        
        if (response.status === 500) {
            console.error('❌ 500 Error detected!');
            console.error('Response:', response.data);
            process.exit(1);
        } else if (response.data && response.data.data && response.data.data.length > 0) {
            console.log('✅ API returned', response.data.data.length, 'objectives');
            console.log('First objective autVal:', response.data.data[0]?.autVal);
            console.log('First objective DateCreation:', response.data.data[0]?.DateCreation);
        } else {
            console.log('✅ API responded successfully (no objectives found)');
        }
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        process.exit(1);
    }
}

testObjectivesAPI();
