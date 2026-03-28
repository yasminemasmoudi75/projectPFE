const { Tiers, TiersClasse, sequelize } = require('./src/models');

async function debugList() {
    try {
        console.log('Fetching all tiers with TiersClasse association...');
        const tiers = await Tiers.findAll({
            include: [{ model: TiersClasse, as: 'tiersClasse' }],
            limit: 5 // Just check first few
        });

        console.log(`Found ${tiers.length} tiers.`);
        tiers.forEach(t => {
            console.log(`- ${t.Raisoc}: Classe ID=${t.Classe}, tiersClasse=${t.tiersClasse ? t.tiersClasse.libelle : 'NULL'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugList();
