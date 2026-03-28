const { sequelize } = require('./src/models');

const checkCols = async () => {
    try {
        const [results] = await sequelize.query("SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('TabBlvd')");
        console.log('TabBlvd Columns:', results.map(r => r.name).join(', '));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkCols();
