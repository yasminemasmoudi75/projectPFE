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
        const res = await client.get('/objectifs?annee=2026');
        console.log('--- API RESPONSE ---');
        console.log('STATUS:', res.status);
        if (res.data) {
            console.log('MESSAGE:', res.data.message);
            if (res.data.error) console.log('ERROR:', res.data.error);
            if (res.data.stack) {
                const lines = res.data.stack.split('\n');
                console.log('STACK TRACE FIRST 5 LINES:');
                console.log(lines.slice(0, 5).join('\n'));
            }
        } else {
            console.log('NO DATA RETURNED');
        }
    } catch (err) {
        console.error('FETCH ERROR:', err.message);
    }
})();
