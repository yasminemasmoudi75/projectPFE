const { BlvMaster, sequelize } = require('./src/models');
const { randomUUID } = require('crypto');

const debugBasicMasterInsert = async () => {
    try {
        console.log('Creating Master...');

        const mGuid = randomUUID();
        // Use GETDATE() for DatUser
        const masterCols = ['Guid', 'Prfx', 'Nf', 'CodTiers', 'DatUser'];
        const masterPlaceholders = ['CAST(:Guid AS UNIQUEIDENTIFIER)', ':Prfx', ':Nf', ':CodTiers', 'GETDATE()'];

        await sequelize.query(`INSERT INTO ${BlvMaster.tableName} (${masterCols.join(', ')}) VALUES (${masterPlaceholders.join(', ')})`, {
            replacements: {
                Guid: mGuid,
                Prfx: 'BL',
                Nf: 9992,
                CodTiers: 'T001'
            }
        });

        console.log('Master created successfully!');
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

debugBasicMasterInsert();
