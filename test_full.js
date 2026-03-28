const { BcvMaster, BcvDetail, DevisMaster, DevisDetail, BlvMaster, BlvDetail, FavMaster, FavDetail, sequelize } = require('./src/models');
const { randomUUID } = require('crypto');

const runTest = async () => {
    let t;
    try {
        t = await sequelize.transaction();

        let sourceData = await BcvMaster.findOne({
            where: { Guid: 'F08E8F63-519F-4404-9626-0823A954AC81' },
            include: [{ model: BcvDetail, as: 'details' }]
        });

        if (!sourceData) {
            console.log('Source not found, using generic data');
            return;
        }

        const data = sourceData.toJSON();
        const details = data.details || [];
        const nextNf = 8899;

        const masterData = {
            Guid: randomUUID(),
            Prfx: 'BL',
            Nf: nextNf,
            CodTiers: data.CodTiers,
            LibTiers: data.LibTiers,
            DatUser: sequelize.fn('GETDATE'),
            TotHT: data.TotHT,
            Valid: false,
            bTransf: false,
            bLivr: true
        };

        await BlvMaster.create(masterData, { transaction: t });

        const newDetails = details.map((d) => ({
            Guid: randomUUID(),
            NF: nextNf,
            CodArt: d.CodArt,
            Qt: d.Qt,
            ID: 'BL'
        }));

        await BlvDetail.bulkCreate(newDetails, { transaction: t });

        await t.commit();
        console.log('✅ End to End Transfer Logical Test Success!');
    } catch (err) {
        if (t) await t.rollback();
        console.log('❌ Error Info:', err.original ? err.original.message : err.message);
    } finally {
        await sequelize.close();
    }
};

runTest();
