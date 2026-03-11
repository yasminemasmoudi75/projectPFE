const { sequelize, User, Projet, Activite, Product, Tiers, Objectif, DevisMaster, DevisDetail, BcvMaster, BcvDetail, TabDI, TabBT, Reclamation } = require('./src/models');

async function checkAll() {
    try {
        await sequelize.authenticate();
        console.log('--- 🛡️ FINAL END-TO-END MODEL CHECK ---');

        const models = [
            { name: 'User', model: User },
            { name: 'Projet', model: Projet },
            { name: 'Activite', model: Activite },
            { name: 'Product', model: Product },
            { name: 'Tiers', model: Tiers },
            { name: 'Objectif', model: Objectif },
            { name: 'DevisMaster', model: DevisMaster },
            { name: 'DevisDetail', model: DevisDetail },
            { name: 'BcvMaster', model: BcvMaster },
            { name: 'BcvDetail', model: BcvDetail },
            { name: 'TabDI', model: TabDI },
            { name: 'TabBT', model: TabBT },
            { name: 'Reclamation', model: Reclamation }
        ];

        for (let m of models) {
            await m.model.findOne();
            console.log(`✅ ${m.name} OK`);
        }

        console.log('\n✅ SUCCESS: All models successfully query the AmsLabOrigin database without schema errors.');

    } catch (e) {
        console.error('\n❌ FAILED:', e.original ? e.original.message : e.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

checkAll();
