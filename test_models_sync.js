const { sequelize, User, Tiers, Product, Projet, Activite, Objectif, DevisMaster, DevisDetail, BcvMaster, BcvDetail, Reclamation, Message, Category, Collection, TabDI, TabBT } = require('./src/models');

async function testSync() {
    try {
        console.log('🔄 Checking database connection...');
        await sequelize.authenticate();
        console.log('✅ Connection established successfully.');

        const models = [
            { name: 'User', model: User },
            { name: 'Tiers', model: Tiers },
            { name: 'Product', model: Product },
            { name: 'Projet', model: Projet },
            { name: 'Activite', model: Activite },
            { name: 'Objectif', model: Objectif },
            { name: 'DevisMaster', model: DevisMaster },
            { name: 'DevisDetail', model: DevisDetail },
            { name: 'BcvMaster', model: BcvMaster },
            { name: 'BcvDetail', model: BcvDetail },
            { name: 'Reclamation', model: Reclamation },
            { name: 'Message', model: Message },
            { name: 'Category', model: Category },
            { name: 'Collection', model: Collection },
            { name: 'TabDI', model: TabDI },
            { name: 'TabBT', model: TabBT }
        ];

        console.log('\n🔍 Testing model synchronization...');
        for (const { name, model } of models) {
            try {
                const count = await model.count({ limit: 1 });
                console.log(`✅ ${name}: OK (Found ${count} records)`);
            } catch (err) {
                console.error(`❌ ${name}: FAILED - ${err.message}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('💥 Initial connection failed:', error);
        process.exit(1);
    }
}

testSync();
