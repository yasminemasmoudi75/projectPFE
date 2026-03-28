const { sequelize } = require('./src/models');

const checkIdentity = async () => {
    try {
        const [results] = await sequelize.query(`
            SELECT name, is_identity 
            FROM sys.columns 
            WHERE object_id = OBJECT_ID('TabBlvd') AND name = 'NoDetail'
        `);
        console.log('TabBlvd NoDetail Identity:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkIdentity();
