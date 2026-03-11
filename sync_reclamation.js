const { Reclamation } = require('./src/models');

async function createTable() {
    try {
        console.log('--- CRÉATION DE LA TABLE TabReclamation ---');
        await Reclamation.sync();
        console.log('✅ Table TabReclamation créée avec succès dans AmsLabOrigin !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la création de la table :', error.message);
        process.exit(1);
    }
}

createTable();
