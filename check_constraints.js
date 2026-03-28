const { sequelize } = require('./src/models');

const checkConstraints = async () => {
    try {
        console.log('🔍 Checking constraints on TabBlvd...');
        const [results] = await sequelize.query(`
            SELECT name, type_desc, definition
            FROM sys.check_constraints
            WHERE parent_object_id = OBJECT_ID('TabBlvd')
        `);
        console.log('Constraints:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkConstraints();
