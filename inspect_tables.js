const { sequelize } = require('./src/config/database');

async function inspectTables() {
    try {
        const tablesToInspect = ['UCS_LOGIN_TRACE', 'UCS_AUDIT', 'TabLog'];

        for (const tableName of tablesToInspect) {
            console.log(`\n--- Structure de la table : ${tableName} ---`);
            const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
      `);
            console.table(columns);

            const [data] = await sequelize.query(`SELECT TOP 3 * FROM ${tableName}`);
            console.log(`Données (Top 3) :`);
            console.table(data);
        }
    } catch (error) {
        console.error('Erreur :', error.message);
    } finally {
        await sequelize.close();
    }
}

inspectTables();
