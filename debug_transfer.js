const { BcvMaster, BlvMaster, sequelize } = require('./src/models');
const { randomUUID } = require('crypto');
const fs = require('fs');

const debugTransferNoTx = async () => {
    try {
        let sourceData = await BcvMaster.findOne({
            where: { Guid: 'F08E8F63-519F-4404-9626-0823A954AC81' }
        });

        if (!sourceData) {
            console.log('Source not found, using generic data');
            sourceData = {
                CodTiers: 'T001',
                LibTiers: 'Test'
            };
        } else {
            sourceData = sourceData.toJSON();
        }

        const data = sourceData;

        const mGuid = randomUUID();
        console.log(`Creating Master with Guid ${mGuid}...`);

        const masterData = {
            Guid: mGuid,
            Prfx: 'BL',
            Nf: 9999,
            CodTiers: data.CodTiers,
            LibTiers: data.LibTiers,
            TotHT: data.TotHT || 0,
            TotTva: data.TotTva || 0,
            TotTTC: data.TotTTC || 0,
            TotRem: data.TotRem || 0,
            DatUser: new Date(),
            Valid: false,
            bTransf: false,
            bLivr: true
        };

        await BlvMaster.create(masterData);
        console.log('✅ Success!');
    } catch (error) {
        console.log('❌ Error caught!');
        const errInfo = error.original ? error.original.message : error.message;
        console.log('❌ Error Name:', error.name);
        console.log('❌ Error Info:', errInfo);
        fs.writeFileSync('sequelize_err_notx.txt', errInfo + '\n\n' + error.stack);
    } finally {
        await sequelize.close();
    }
};

debugTransferNoTx();
