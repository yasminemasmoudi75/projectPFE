const { sequelize } = require('./src/config/database');

async function runSQL() {
    try {
        console.log('Création de la table tiersClasse...');
        await sequelize.query(`
      CREATE TABLE tiersClasse (
          id INT IDENTITY(1,1) PRIMARY KEY,
          libelle NVARCHAR(50) NOT NULL
      );
    `);

        console.log('Insertion des données...');
        await sequelize.query(`
      INSERT INTO tiersClasse (libelle) VALUES 
      ('passif'), ('inactif'), ('prospect'), ('gold');
    `);

        try {
            console.log('Suppression de l\'ancienne colonne Classe...');
            await sequelize.query(`ALTER TABLE TabTiers DROP COLUMN Classe;`);
        } catch (e) {
            console.log('Colonne Classe introuvable ou dejà supprimée.');
        }

        console.log('Ajout de la nouvelle colonne Classe...');
        await sequelize.query(`ALTER TABLE TabTiers ADD Classe INT NULL;`);

        console.log('Ajout de la contrainte FK...');
        await sequelize.query(`
      ALTER TABLE TabTiers 
      ADD CONSTRAINT FK_TabTiers_tiersClasse 
      FOREIGN KEY (Classe) REFERENCES tiersClasse(id);
    `);

        console.log('✅ Base de données mise à jour avec succès');
    } catch (e) {
        console.error('Erreur SQL:', e);
    } finally {
        process.exit(0);
    }
}

runSQL();
