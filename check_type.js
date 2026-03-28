const { sequelize } = require('./src/models');

const checkType = async () => {
    try {
        const [results] = await sequelize.query("SELECT type_desc FROM sys.objects WHERE name = 'TabBlvd'");
        console.log('TabBlvd Type:', results[0].type_desc);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkType();
