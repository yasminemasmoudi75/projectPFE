const { Tiers, TiersClasse, TiersGouvernorat, TiersCategorie, sequelize } = require('./src/models');

async function diagnostic() {
    try {
        console.log('--- DIAGNOSTIC START ---');
        console.log('Testing Tiers.findAll with all includes...');

        const tiers = await Tiers.findAll({
            limit: 1,
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' },
                { model: TiersCategorie, as: 'tiersCategorieObj' }
            ]
        });

        console.log('✅ Success! Found:', tiers.length, 'tier(s)');
        if (tiers.length > 0) {
            console.log('Category Libelle:', tiers[0].tiersCategorieObj?.libelle || 'N/A');
        }
    } catch (error) {
        console.error('❌ FAILURE:', error.name);
        console.error('Message:', error.message);
        if (error.original) {
            console.error('Original Error:', error.original.message);
        }
        console.error('Stack:', error.stack);
    } finally {
        await sequelize.close();
    }
}

diagnostic();
