const { sequelize } = require('./src/config/database');

async function check() {
    try {
        const tableName = 'Objectif';
        const [res] = await sequelize.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'`);
        console.log(`${tableName} Columns:`);
        res.forEach(r => console.log(`- ${r.COLUMN_NAME}`));

        const [data] = await sequelize.query(`SELECT TOP 1 * FROM ${tableName}`);
        console.log(`\n${tableName} Sample Data:`);
        console.log(data);

        const tableName2 = 'TabLogConnexion';
        const [res2] = await sequelize.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName2}'`);
        if (res2.length > 0) {
            console.log(`\n${tableName2} Columns:`);
            res2.forEach(r => console.log(`- ${r.COLUMN_NAME}`));
        } else {
            console.log(`\n${tableName2} non trouvée.`);
        }

    } catch (e) {
        console.error(e.message);
    } finally {
        await sequelize.close();
    }
}

check();
