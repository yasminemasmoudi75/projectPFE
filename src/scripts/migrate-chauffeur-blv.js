zz/**
 * Migration : Ajout des colonnes CodChauff et DesChauff dans TabBlvm
 * Usage : node src/scripts/migrate-chauffeur-blv.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { sequelize } = require('../config/database');

async function migrate() {
    console.log('\n🚀 Début de la migration : colonnes chauffeur TabBlvm\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Connexion SQL Server OK\n');
    } catch (err) {
        console.error('❌ Impossible de se connecter à la base de données:', err.message);
        process.exit(1);
    }

    const queries = [
        {
            label: 'CodChauff (téléphone chauffeur)',
            check: `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'TabBlvm' AND COLUMN_NAME = 'CodChauff'`,
            alter: `ALTER TABLE TabBlvm ADD CodChauff NVARCHAR(20) NULL`
        },
        {
            label: 'DesChauff (nom chauffeur)',
            check: `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'TabBlvm' AND COLUMN_NAME = 'DesChauff'`,
            alter: `ALTER TABLE TabBlvm ADD DesChauff NVARCHAR(100) NULL`
        }
    ];

    for (const { label, check, alter } of queries) {
        const [rows] = await sequelize.query(check);
        const exists = rows[0]?.cnt > 0;

        if (exists) {
            console.log(`⚠️  Colonne ${label} existe déjà — ignorée.`);
        } else {
            await sequelize.query(alter);
            console.log(`✅ Colonne ${label} ajoutée avec succès.`);
        }
    }

    // Vérification finale
    console.log('\n📋 État final des colonnes chauffeur dans TabBlvm :');
    const [cols] = await sequelize.query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'TabBlvm'
          AND COLUMN_NAME IN ('CodChauff', 'DesChauff')
        ORDER BY COLUMN_NAME
    `);

    if (cols.length === 0) {
        console.error('❌ ERREUR : Aucune colonne trouvée après migration !');
    } else {
        cols.forEach(c => {
            console.log(`   - ${c.COLUMN_NAME} | ${c.DATA_TYPE}(${c.CHARACTER_MAXIMUM_LENGTH}) | NULL=${c.IS_NULLABLE}`);
        });
        console.log('\n✅ Migration terminée avec succès !');
    }

    await sequelize.close();
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Erreur migration:', err.message);
    process.exit(1);
});
