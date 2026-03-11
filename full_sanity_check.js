const { User, Projet, Activite, Tiers, Product } = require('./src/models');

async function sanityCheck() {
    console.log('--- 🛡️ SYSTEM SANITY CHECK (Detailed) ---');
    try {
        console.log('1. User...');
        const user = await User.findOne({ where: { EmailPro: 'anis' } });
        console.log('✅ User OK');

        console.log('2. Projet...');
        const p = await Projet.findOne();
        console.log('✅ Projet OK');

        console.log('3. Activite...');
        const a = await Activite.findOne();
        console.log('✅ Activite OK');

        console.log('4. Tiers...');
        const t = await Tiers.findOne();
        console.log('✅ Tiers OK');

        console.log('5. Product...');
        const pr = await Product.findOne();
        console.log('✅ Product OK');

        process.exit(0);
    } catch (err) {
        console.error('❌ CRITICAL ERROR:', err);
        process.exit(1);
    }
}

sanityCheck();
