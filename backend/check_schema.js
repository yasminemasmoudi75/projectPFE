const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkSchema() {
    try {
        console.log('--- Checking TabObjectifs Columns ---');
        const results = await sequelize.query(
            "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabObjectifs'",
            { type: QueryTypes.SELECT }
        );
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
