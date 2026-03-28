const axios = require('axios');

const testListAPI = async () => {
    try {
        // Authenticate as nexus@pfe.com to get a token
        console.log('Authenticating...');
        const authReq = await axios.post('http://localhost:3066/api/auth/login', {
            EmailPro: 'nexus@pfe.com',
            Password: 'password123'
        });
        const token = authReq.data.token;
        console.log('✅ Authenticated');

        // Fetch /api/blv
        console.log('Fetching /api/blv...');
        const res = await axios.get('http://localhost:3066/api/blv?page=1&limit=10', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Fetched ${res.data.data.length} records`);
        console.log(JSON.stringify(res.data.data.slice(0, 5), null, 2));

    } catch (err) {
        console.error('❌ Request error:', err.response?.data || err.message);
    }
};

testListAPI();
