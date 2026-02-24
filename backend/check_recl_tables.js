require('dotenv').config();
const { sequelize } = require('./src/config/database');

(async () => {
    try {
        await sequelize.authenticate();

        const tables = ['TabBT', 'TabDI', 'TabPanne', 'TabPannes', 'TabSymptome', 'TabRemedes', 'TabEquipement'];

        for (const table of tables) {
            try {
                const [cols] = await sequelize.query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = '${table}'
          ORDER BY ORDINAL_POSITION
        `);
                console.log(`\n========== ${table} (${cols.length} colonnes) ==========`);
                cols.forEach(c => {
                    const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : '';
                    const nullable = c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
                    console.log(`  ${c.COLUMN_NAME.padEnd(30)} ${c.DATA_TYPE}${len} ${nullable}`);
                });

                // Show sample row
                const [rows] = await sequelize.query(`SELECT TOP 1 * FROM [${table}]`);
                if (rows.length > 0) {
                    console.log(`  --- Exemple ---`);
                    console.log(JSON.stringify(rows[0], null, 2).split('\n').slice(0, 15).join('\n'));
                }
            } catch (e) {
                console.log(`\n  [${table}] Erreur: ${e.message}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err.message);
        process.exit(1);
    }
})();
