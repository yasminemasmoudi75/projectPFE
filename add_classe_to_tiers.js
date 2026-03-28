const { sequelize } = require('./src/config/database');

async function addClasseColumn() {
    try {
        console.log('Connexion à la base de données réussie.');

        // Check if column already exists before adding it
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('TabTiers');

        if (tableInfo.Classe) {
            console.log('La colonne "Classe" existe déjà dans la table "TabTiers".');
        } else {
            console.log('Ajout de la colonne "Classe" à la table "TabTiers"...');
            await sequelize.query(`ALTER TABLE TabTiers ADD Classe NVARCHAR(20) NULL;`);
            console.log('✅ Colonne "Classe" ajoutée avec succès !');
        }

    } catch (error) {
        console.error('Erreur lors de la modification de la table:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

addClasseColumn();
