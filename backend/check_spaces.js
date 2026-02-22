const { testConnection, sequelize } = require('./src/config/database');

async function checkSpaces() {
    try {
        const isConnected = await testConnection();
        if (!isConnected) return;

        const [results] = await sequelize.query("SELECT TOP 5 Nf, LEN(Nf) as l, DATALENGTH(Nf) as dl FROM TabDevm");
        console.log(results);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSpaces();
