const { sequelize } = require('./src/models');

const checkColumns = async () => {
    try {
        console.log('🔍 Listing ALL computed columns on TabBcvm and TabBcvd...');
        const [mResults] = await sequelize.query(`
            SELECT name FROM sys.computed_columns WHERE object_id = OBJECT_ID('TabBcvm')
        `);
        const [dResults] = await sequelize.query(`
            SELECT name FROM sys.computed_columns WHERE object_id = OBJECT_ID('TabBcvd')
        `);
        console.log('TabBcvm Computed:', mResults.map(r => r.name).join(', '));
        console.log('TabBcvd Computed:', dResults.map(r => r.name).join(', '));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkColumns();
