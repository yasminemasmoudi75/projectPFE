const { sequelize } = require('./src/models');

async function migrateCategories() {
    const transaction = await sequelize.transaction();
    try {
        console.log('--- MIGRATION CATEGORIES ---');

        // 1. Créer la table tiersCategorie si elle n'existe pas
        await sequelize.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tiersCategorie' AND xtype='U')
            CREATE TABLE tiersCategorie (
                id INT IDENTITY(1,1) PRIMARY KEY,
                libelle NVARCHAR(50) NOT NULL
            )
        `, { transaction });
        console.log('✅ Table tiersCategorie créée');

        // 2. Insérer les catégories par défaut
        await sequelize.query(`
            IF NOT EXISTS (SELECT * FROM tiersCategorie WHERE libelle = 'Privé')
            INSERT INTO tiersCategorie (libelle) VALUES ('Privé');
            
            IF NOT EXISTS (SELECT * FROM tiersCategorie WHERE libelle = 'Etatique')
            INSERT INTO tiersCategorie (libelle) VALUES ('Etatique');
        `, { transaction });
        console.log('✅ Catégories initialisées');

        // 3. Préparer TabTiers pour la nouvelle colonne
        // Renommer l'ancienne colonne si elle s'appelle encore Categorie (et si ce n'est pas déjà un INT)
        const [cols] = await sequelize.query(`
            SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TabTiers' AND COLUMN_NAME = 'Categorie'
        `, { transaction });

        if (cols.length > 0 && cols[0].DATA_TYPE !== 'int') {
            await sequelize.query(`EXEC sp_rename 'TabTiers.Categorie', 'Categorie_old', 'COLUMN'`, { transaction });
            await sequelize.query(`ALTER TABLE TabTiers ADD Categorie INT`, { transaction });
            console.log('✅ Colonne TabTiers.Categorie migrée vers Categorie_old et nouvelle colonne INT créée');

            // 4. Migrer les données existantes
            await sequelize.query(`
                UPDATE T
                SET T.Categorie = C.id
                FROM TabTiers T
                INNER JOIN tiersCategorie C ON T.Categorie_old = C.libelle
            `, { transaction });
            console.log('✅ Données existantes migrées');
        } else if (cols.length === 0) {
            await sequelize.query(`ALTER TABLE TabTiers ADD Categorie INT`, { transaction });
            console.log('✅ Colonne TabTiers.Categorie (INT) créée');
        }

        // 5. Ajouter la clé étrangère
        await sequelize.query(`
            IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TabTiers_tiersCategorie')
            ALTER TABLE TabTiers ADD CONSTRAINT FK_TabTiers_tiersCategorie
            FOREIGN KEY (Categorie) REFERENCES tiersCategorie(id)
        `, { transaction });
        console.log('✅ Clé étrangère ajoutée');

        await transaction.commit();
        console.log('--- MIGRATION RÉUSSIE ---');
    } catch (error) {
        await transaction.rollback();
        console.error('❌ ERREUR MIGRATION:', error);
    } finally {
        await sequelize.close();
    }
}

migrateCategories();
