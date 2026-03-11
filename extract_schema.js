const { sequelize } = require('./src/config/database');
const fs = require('fs');

async function extractSchema() {
    try {
        console.log('--- Extraction du schéma AmsLabOrigin ---');

        const [tables] = await sequelize.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        const schema = {};

        for (const row of tables) {
            const tableName = row.TABLE_NAME;
            const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
      `);
            schema[tableName] = columns;
        }

        fs.writeFileSync('database_schema.json', JSON.stringify(schema, null, 2));
        console.log('Schéma extrait avec succès dans database_schema.json');
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await sequelize.close();
    }
}

extractSchema();
