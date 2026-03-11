const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
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
        let out = 'STATUS: ' + res.status + '\n';
        out += 'BODY: ' + JSON.stringify(res.data, null, 2) + '\n';
        fs.writeFileSync('api_error_full.log', out);
        console.log('DONE. Check api_error_full.log');
    } catch (err) {
        console.error('FETCH ERROR:', err.message);
    }
})();
