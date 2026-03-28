const { BcvMaster, BcvDetail, BlvMaster, BlvDetail, FavMaster, FavDetail, sequelize } = require('./src/models');
const { randomUUID } = require('crypto');
const fs = require('fs');

const debugMasterTransfer = async () => {
    try {
        const id = 'F08E8F63-519F-4404-9626-0823A954AC81';
        let sourceData = await BcvMaster.findOne({
            where: { Guid: id }
        });

        if (!sourceData) {
            console.log('Source not found!');
            return;
        }

        const data = sourceData.toJSON();
        const MasterModel = BlvMaster;

        console.log('Creating Master...');

        const mGuid = randomUUID();
        const masterCols = ['Guid', 'Prfx', 'Nf', 'CodTiers', 'LibTiers', 'DatUser'];
        const masterPlaceholders = masterCols.map(c => c === 'Guid' ? 'CAST(:Guid AS UNIQUEIDENTIFIER)' : `:${c}`).join(', ');

        await sequelize.query(`INSERT INTO ${MasterModel.tableName} (${masterCols.join(', ')}) VALUES (${masterPlaceholders})`, {
            replacements: {
                Guid: mGuid,
                Prfx: 'BL',
                Nf: 9999,
                CodTiers: data.CodTiers,
                LibTiers: data.LibTiers,
                DatUser: new Date()
            }
        });

        console.log('Master created successfully');
    } catch (error) {
        console.log('❌ Error Name:', error.name);
        if (error.original) {
            console.log('❌ SQL Error:', error.original.message);
        } else {
            console.log('❌ Error message:', error.message);
        }
    } finally {
        await sequelize.close();
    }
};

debugMasterTransfer();
