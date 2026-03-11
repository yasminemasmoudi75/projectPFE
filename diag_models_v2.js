const models = [
    'User', 'Message', 'Projet', 'Activite', 'Objectif', 'Tiers', 'Product',
    'Category', 'Collection', 'DevisMaster', 'DevisDetail', 'BcvMaster',
    'BcvDetail', 'Reclamation', 'TabDI', 'TabBT'
];

console.log('1. Loading database config...');
const db = require('./src/config/database');
console.log('✅ DB Config loaded. Sequelize is:', typeof db.sequelize);

console.log('2. Loading models individually...');
for (const m of models) {
    try {
        console.log(`⏳ Loading ${m}...`);
        const model = require(`./src/models/${m}`);
        console.log(`✅ ${m} loaded. Model is:`, typeof model);
    } catch (err) {
        console.error(`❌ FAILED loading ${m}:`, err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

console.log('3. Loading index.js...');
try {
    require('./src/models/index');
    console.log('✅ index.js loaded.');
} catch (err) {
    console.error('❌ FAILED loading index.js:', err.message);
    console.error(err.stack);
}
