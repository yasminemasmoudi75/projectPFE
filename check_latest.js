const { BlvMaster, FavMaster, sequelize } = require('./src/models');

const checkLatest = async () => {
    try {
        const blvs = await BlvMaster.findAll({
            order: [['DatUser', 'DESC']],
            limit: 5
        });
        console.log('Latest BLVs:', blvs.map(b => ({ Guid: b.Guid, Nf: b.Nf, Prfx: b.Prfx, CodTiers: b.CodTiers, DatUser: b.DatUser })));

        const favs = await FavMaster.findAll({
            order: [['DatUser', 'DESC']],
            limit: 5
        });
        console.log('Latest FAVs:', favs.map(b => ({ Guid: b.Guid, Nf: b.Nf, Prfx: b.Prfx, CodTiers: b.CodTiers, DatUser: b.DatUser })));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
};

checkLatest();
