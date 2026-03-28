const { sequelize } = require('./src/models');

const checkColumns = async () => {
    try {
        console.log('🔍 Checking TabBlvd columns for computed status...');
        const [results] = await sequelize.query(`
            SELECT name, is_computed, definition
            FROM sys.computed_columns
            WHERE object_id = OBJECT_ID('TabBlvd')
        `);
        console.log('Computed Columns:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkColumns();
