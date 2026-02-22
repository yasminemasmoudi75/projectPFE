const { testConnection, sequelize } = require('./src/config/database');

async function checkMetadata() {
    try {
        const isConnected = await testConnection();
        if (!isConnected) return;

        console.log('--- TabDevm Columns ---');
        const [mCols] = await sequelize.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabDevm'");
        mCols.forEach(c => {
            if (c.COLUMN_NAME === 'Nf') console.log(`${c.COLUMN_NAME}: ${c.DATA_TYPE}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMetadata();
