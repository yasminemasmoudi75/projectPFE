const jwt = require('jsonwebtoken');
const axios = require('axios');

const secret = 'nexus-crm-super-secret-jwt-key-2024-change-in-production';
const token = jwt.sign({ id: 6, role: 'Admin' }, secret, { expiresIn: '1h' });

const client = axios.create({
    baseURL: 'http://localhost:3066/api',
    headers: { 'Authorization': `Bearer ${token}` },
    validateStatus: () => true
});

(async () => {
    console.log('--- REPRODUCING 500 ---');
    const res = await client.post('/products', {
        LibArt: 'TEST PRODUCT REPRO',
        PrixVente: 100,
        Qte: 10
    });
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
})();
