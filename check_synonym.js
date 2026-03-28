const { sequelize } = require('./src/models');

const checkSynonym = async () => {
    try {
        const [results] = await sequelize.query("SELECT * FROM sys.synonyms WHERE name = 'TabBlvd'");
        console.log('TabBlvd Synonym:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkSynonym();
