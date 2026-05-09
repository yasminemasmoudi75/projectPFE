/**
 * Script d'exécution de migration SQL
 * Exécute: migrations/20260504_add_objectif_paiements.sql
 * 
 * Usage: node run_migration.js
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/database');

async function runMigration() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 MIGRATION: Ajouter colonnes objectif + table paiements');
  console.log('='.repeat(80) + '\n');

  try {
    // Authentifier
    console.log('🔗 Connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connecté\n');

    // Lire le fichier SQL
    console.log('📄 Chargement du script SQL...');
    const sqlPath = path.join(__dirname, 'migrations', '20260504_add_objectif_paiements.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    console.log('✅ Script chargé\n');

    // Exécuter le script
    console.log('⚙️  Exécution du script SQL...\n');
    const result = await sequelize.query(sqlContent);

    console.log('\n' + '='.repeat(80));
    console.log('✅ MIGRATION RÉUSSIE');
    console.log('='.repeat(80));
    console.log('\n📋 Prochaines étapes:');
    console.log('  1. Vérifier le schéma: node test_schema_check.js');
    console.log('  2. Tester la logique: node test_paiement_logic.js');
    console.log('  3. Démarrer le serveur: npm start\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR MIGRATION:');
    console.error(error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
