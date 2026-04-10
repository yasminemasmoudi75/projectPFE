const { sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function checkCounts() {
    const tables = ['TabDevd', 'TabBcvd', 'TabBlvd', 'TabFavd'];
    for (const t of tables) {
        const res = await sequelize.query(`SELECT COUNT(*) as count FROM ${t}`, { type: QueryTypes.SELECT });
        console.log(`${t}: ${res[0].count}`);
    }
}

checkCounts().catch(console.error).finally(() => process.exit());
