const { BlvMaster, sequelize } = require('./src/models');
const { randomUUID } = require('crypto');

const testNoDate = async () => {
    try {
        const masterData = {
            Guid: randomUUID(),
            Prfx: 'BL',
            Nf: 8881,
            CodTiers: 'T001',
            LibTiers: 'Test',
            Valid: false,
            bTransf: false,
            bLivr: true,
            // ❌ No DatUser!
        };
        await BlvMaster.create(masterData);
        console.log('✅ Master Success!');

        const detailData = {
            Guid: randomUUID(),
            NF: 8881,
            CodArt: 'TEST_ART_01',
            Qt: 1,
            ID: 'BL'
        };
        await require('./src/models').BlvDetail.create(detailData);
        console.log('✅ Detail Success!');
    } catch (err) {
        console.log('❌ Error Info:', err.original ? err.original.message : err.message);
    } finally {
        await sequelize.close();
    }
};

testNoDate();
