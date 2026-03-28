const axios = require('axios');
const jwt = require('jsonwebtoken');

const testApi = async () => {
    try {
        // Create token manually based on auth setup
        const token = jwt.sign(
            { id: 14, EmailPro: 'nexus@pfe.com' },
            process.env.JWT_SECRET || 'ams_lab_secret_key_2024',
            { expiresIn: '1d' }
        );

        console.log('✅ Generated Token. Fetching /api/blv...');

        const res = await axios.get('http://localhost:3066/api/blv?page=1&limit=10', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Success! Fetched ${res.data.data.length} BLVs via API Server`);
        console.log(JSON.stringify(res.data.data.slice(0, 2), null, 2));

    } catch (err) {
        if (err.response) {
            console.error('❌ API Error Info:', err.response.status, err.response.data);
        } else {
            console.error('❌ Error:', err.message);
        }
    }
};

testApi();
