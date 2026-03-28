const { sequelize } = require('./src/models');

const checkIndexes = async () => {
    try {
        const [results] = await sequelize.query(`
            SELECT name, filter_definition 
            FROM sys.indexes 
            WHERE object_id = OBJECT_ID('TabBlvd') AND has_filter = 1
        `);
        console.log('Filtered Indexes:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkIndexes();
