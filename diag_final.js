const models = [
    'User', 'Message', 'Projet', 'Activite', 'Objectif', 'Tiers', 'Product',
    'Category', 'Collection', 'DevisMaster', 'DevisDetail', 'BcvMaster',
    'BcvDetail', 'Reclamation', 'TabDI', 'TabBT'
];

console.log('--- START DIAGNOSTIC ---');
const db = require('./src/config/database');
console.log('DB Config loaded.');

for (const m of models) {
    try {
        console.log(`⏳ Loading ${m}...`);
        require(`./src/models/${m}`);
        console.log(`✅ ${m} OK`);
    } catch (err) {
        console.error(`❌ FAILED ${m}:`, err.message);
        console.error(err.stack);
        process.exit(1);
    }
}
console.log('--- ALL MODELS LOADED ---');
require('./src/models/index');
console.log('--- INDEX LOADED ---');
