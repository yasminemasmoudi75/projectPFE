const { sequelize } = require('./src/models');

const checkCols = async () => {
    try {
        const [results] = await sequelize.query(`
            SELECT c.name, t.name as type_name, c.max_length, c.is_nullable
            FROM sys.columns c
            JOIN sys.types t ON c.system_type_id = t.system_type_id
            WHERE c.object_id = OBJECT_ID('TabBlvm') AND c.name = 'DatUser'
        `);
        console.log('DatUser type info:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkCols();
