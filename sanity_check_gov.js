const { Tiers, TiersClasse, TiersGouvernorat, sequelize } = require('./src/models');

async function sanityCheck() {
    try {
        console.log('Fetching a tier with all associations...');
        const tier = await Tiers.findOne({
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' }
            ]
        });

        if (tier) {
            console.log('Client:', tier.Raisoc);
            console.log('Classe:', tier.tiersClasse ? tier.tiersClasse.libelle : 'None');
            console.log('Gouvernorat:', tier.region ? tier.region.libelle : 'None');
            console.log('SUCCESS: Associations working.');
        } else {
            console.log('No tiers found for check.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

sanityCheck();
