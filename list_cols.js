const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');
const fs = require('fs');

async function list() {
    const tables = ['TabDevm', 'TabBcvm'];
    let output = '';
    for (const t of tables) {
        const r = await sequelize.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${t}'`, { type: QueryTypes.SELECT });
        output += `Table ${t}: ${r.map(c => c.COLUMN_NAME).join(', ')}\n`;
    }
    fs.writeFileSync('cols.txt', output);
    process.exit(0);
}

list();
