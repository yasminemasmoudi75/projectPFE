/**
 * Vérification du schéma DB
 */
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK\n');

    // Vérifier les colonnes
    const result = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME='Objectif' 
      AND COLUMN_NAME IN ('StatutObjectif', 'DateClotureAdmin', 'IdUtilisateurClotureAdmin')
    `);

    console.log('Colonnes requises dans Objectif:');
    if (result[0].length === 0) {
      console.log('❌ Aucune colonne trouvée!');
      console.log('   → Vous devez exécuter la migration:');
      console.log('   → node backend/run_migration.js');
      console.log('\nOu créer manuellement avec SQL:');
      console.log(`
      ALTER TABLE Objectif
      ADD 
        StatutObjectif VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
        DateClotureAdmin DATETIME NULL,
        IdUtilisateurClotureAdmin INT NULL,
        NombreReglementsLies INT NOT NULL DEFAULT 0;
      `);
    } else {
      result[0].forEach(r => console.log(`   ✅ ${r.COLUMN_NAME}`));
    }

    // Vérifier TabReglements
    console.log('\nVérification table TabReglements:');
    const tableCheck = await sequelize.query(`
      SELECT COUNT(*) as existe 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'TabReglements'
    `);

    if (tableCheck[0][0].existe === 1) {
      console.log('   ✅ Table TabReglements existe');
    } else {
      console.log('   ❌ Table TabReglements manquante');
      console.log('   → Vous devez créer la table avec:');
      console.log(`
      CREATE TABLE TabReglements (
        ID_Reglement UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ID_Facture UNIQUEIDENTIFIER NOT NULL,
        ID_Objectif UNIQUEIDENTIFIER,
        CodRepres VARCHAR(10) NOT NULL,
        Montant DECIMAL(15,2) NOT NULL,
        DateReglement DATE NOT NULL DEFAULT GETDATE(),
        MoyenPaiement VARCHAR(50),
        Reference VARCHAR(100),
        Observations TEXT,
        ID_Utilisateur INT,
        DateCreation DATETIME NOT NULL DEFAULT GETDATE(),
        DateModification DATETIME NOT NULL DEFAULT GETDATE(),
        Statut VARCHAR(20) NOT NULL DEFAULT 'Enregistré'
      );
      `);
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    process.exit(1);
  }
})();
