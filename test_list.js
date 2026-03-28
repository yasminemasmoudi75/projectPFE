const { BlvMaster, Tiers, sequelize } = require('./src/models');
const fs = require('fs');

const testQuery = async () => {
    try {
        const { count, rows } = await BlvMaster.findAndCountAll({
            where: {},
            include: [{ model: Tiers, as: 'client' }],
            order: [['DatUser', 'DESC']],
            limit: 10,
            offset: 0,
        });

        console.log(`Found ${count} total BLVs. Fetched 10.`);
        fs.writeFileSync('test_blv_list.txt', JSON.stringify(rows, null, 2));
        console.log('✅ Output saved to test_blv_list.txt');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
};

testQuery();
