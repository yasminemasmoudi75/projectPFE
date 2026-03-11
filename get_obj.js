const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');
const fs = require('fs');

async function go() {
    const cols = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Objectif'", { type: QueryTypes.SELECT });
    fs.writeFileSync('cols_obj.txt', cols.map(c => c.COLUMN_NAME).join(', '), 'utf8');
    console.log('Done');
    process.exit(0);
}

go();
