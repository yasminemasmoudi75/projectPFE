const { sequelize } = require('./src/config/database');

async function check() {
    try {
        const [res] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UCS_LOGIN_TRACE'");
        console.log('UCS_LOGIN_TRACE Columns:');
        res.forEach(r => console.log(`- ${r.COLUMN_NAME}`));

        const [data] = await sequelize.query("SELECT TOP 1 * FROM UCS_LOGIN_TRACE");
        console.log('\nUCS_LOGIN_TRACE Sample Data:');
        console.log(data);
    } catch (e) {
        console.error(e.message);
    } finally {
        await sequelize.close();
    }
}

check();
