const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';
const userId = 30;
const token = jwt.sign({ id: userId, role: 'Admin' }, secret, { expiresIn: '1h' });

const client = axios.create({
    baseURL: 'http://localhost:3066/api',
    headers: { 'Authorization': `Bearer ${token}` },
    validateStatus: () => true
});

(async () => {
    try {
        console.log('--- TESTING OBJECTIFS API AT http://localhost:3066/api/objectifs ---');
        const res = await client.get('/objectifs?annee=2026');
        console.log('STATUS:', res.status);
        console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
        console.log('BODY:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('FETCH ERROR:', err.message);
    }
})();
