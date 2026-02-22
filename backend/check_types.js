const { testConnection, sequelize } = require('./src/config/database');

async function checkMetadata() {
    try {
        const isConnected = await testConnection();
        if (!isConnected) return;

        const [mMeta] = await sequelize.query("SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabDevm' AND COLUMN_NAME = 'Nf'");
        console.log('MASTER:', mMeta[0]);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMetadata();
