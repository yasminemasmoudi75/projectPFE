const { sequelize } = require('./src/models');

const checkTriggers = async () => {
    try {
        console.log('🔍 Checking triggers on TabBlvd...');
        const [results] = await sequelize.query(`
            SELECT name, object_id, parent_id, type_desc
            FROM sys.triggers
            WHERE parent_id = OBJECT_ID('TabBlvd')
        `);
        console.log('Triggers:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkTriggers();
