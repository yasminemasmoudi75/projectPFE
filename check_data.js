const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function check() {
    try {
        console.log('--- DB Check ---');
        const db = await sequelize.query("SELECT DB_NAME() as db", { type: QueryTypes.SELECT });
        console.log('Current DB:', db[0].db);

        const tables = ['Sec_Users', 'UCS_USERS', 'UCS_USERINFO', 'TabTiers'];
        for (const t of tables) {
            try {
                const count = await sequelize.query(`SELECT COUNT(*) as cnt FROM ${t}`, { type: QueryTypes.SELECT });
                console.log(`Table ${t}: ${count[0].cnt} records`);
            } catch (e) {
                console.log(`Table ${t}: Error or not found`);
            }
        }

        // Check one record from Sec_Users
        const users = await sequelize.query("SELECT TOP 1 * FROM Sec_Users", { type: QueryTypes.SELECT });
        console.log('Sample User from Sec_Users:', JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

check();
