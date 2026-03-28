const { sequelize } = require('./src/models');

const checkTable = async () => {
    try {
        console.log('🔍 Checking TabBcvd structure...');
        const [results] = await sequelize.query("EXEC sp_help 'TabBcvd'");
        console.log('Table Info:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkTable();
