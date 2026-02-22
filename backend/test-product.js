const axios = require('axios');

// 🧪 SCRIPT DE TEST CRUD PRODUITS
// Instructions:
// 1. Démarrez le serveur (npm start)
// 2. Obtenez un token JWT
// 3. Remplacez la valeur ci-dessous

const BASE_URL = 'http://localhost:5000/api';
const TOKEN = 'YOUR_JWT_TOKEN_HERE';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    },
    validateStatus: () => true
});

async function runTests() {
    console.log('==================================================');
    console.log('🧪 TESTS CRUD PRODUITS');
    console.log('==================================================\n');

    if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
        console.error('❌ ERREUR: Vous devez fournir un token JWT valide');
        return;
    }

    let testProductId = null;

    // 1. CREATE
    console.log('📝 TEST 1: Créer un nouveau produit');
    console.log('==================================================');
    const newProductData = {
        CodArt: 'TEST-' + Date.now().toString().slice(-6),
        LibArt: 'Produit Test cURL',
        Description: 'Ceci est un produit de test créé via script',
        PrixVente: 125.500,
        PrixAchat: 85.000,
        Qte: 50,
        Collection: 'DIVERS',
        Marque: 'NEXUS',
        Tva: 19
    };

    const createRes = await client.post('/products', newProductData);
    if (createRes.status === 201) {
        console.log('✅ Succès!');
        testProductId = createRes.data.data.IDArt;
        console.log('ID du produit:', testProductId);
    } else {
        console.error('❌ Échec:', createRes.status, createRes.data);
        return;
    }
    console.log('\n');

    // 2. READ ALL
    console.log('📋 TEST 2: Récupérer tous les produits');
    console.log('==================================================');
    const listRes = await client.get('/products?limit=5');
    if (listRes.status === 200) {
        console.log('✅ Succès!');
        console.log('Total produits:', listRes.data.pagination?.total);
        console.log('Produits retournés:', listRes.data.data?.length);
    } else {
        console.error('❌ Échec:', listRes.status, listRes.data);
    }
    console.log('\n');

    // 3. READ BY ID
    console.log('🔍 TEST 3: Récupérer le produit par son ID');
    console.log('==================================================');
    const getRes = await client.get(`/products/${testProductId}`);
    if (getRes.status === 200) {
        console.log('✅ Succès!');
        console.log('Désignation:', getRes.data.data.LibArt);
    } else {
        console.error('❌ Échec:', getRes.status, getRes.data);
    }
    console.log('\n');

    // 4. UPDATE
    console.log('🔄 TEST 4: Mettre à jour le produit');
    console.log('==================================================');
    const updateData = {
        LibArt: 'Produit Test MODIFIÉ',
        PrixVente: 150.000,
        Qte: 45
    };
    const updateRes = await client.put(`/products/${testProductId}`, updateData);
    if (updateRes.status === 200) {
        console.log('✅ Succès!');
        console.log('Nouveau LibArt:', updateRes.data.data.LibArt);
        console.log('Nouveau Prix:', updateRes.data.data.PrixVente);
    } else {
        console.error('❌ Échec:', updateRes.status, updateRes.data);
    }
    console.log('\n');

    // 5. ERREUR VALIDATION
    console.log('❌ TEST 5: Tester la validation (LibArt vide)');
    console.log('==================================================');
    const failRes = await client.post('/products', { CodArt: 'FAIL' });
    if (failRes.status === 400) {
        console.log('✅ Succès (Erreur attendue):', failRes.data.message);
    } else {
        console.error('❌ Échec: Devrait retourner 400, a retourné', failRes.status);
    }
    console.log('\n');

    // 6. DELETE
    console.log('🗑️ TEST 6: Supprimer le produit');
    console.log('==================================================');
    const delRes = await client.delete(`/products/${testProductId}`);
    if (delRes.status === 200) {
        console.log('✅ Succès!');
        console.log('Message:', delRes.data.message);
    } else {
        console.error('❌ Échec:', delRes.status, delRes.data);
    }
    console.log('\n');

    console.log('==================================================');
    console.log('✅ TOUS LES TESTS SONT TERMINÉS!');
    console.log('==================================================');
}

runTests();
