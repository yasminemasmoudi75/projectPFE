const { sequelize } = require('./src/models');

const checkNullable = async () => {
    try {
        const [results] = await sequelize.query(`
            SELECT name, is_nullable 
            FROM sys.columns 
            WHERE object_id = OBJECT_ID('TabBlvd') AND is_computed = 0
        `);
        console.log('TabBlvd Nullability:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkNullable();
