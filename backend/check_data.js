const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkData() {
    try {
        console.log('--- Checking TabObjectifs Sample Data ---');
        const results = await sequelize.query(
            "SELECT TOP 1 * FROM TabObjectifs",
            { type: QueryTypes.SELECT }
        );
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
}

checkData();
