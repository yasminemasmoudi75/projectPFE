const { Tiers, TiersClasse, TiersGouvernorat, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function sanityCheck() {
    try {
        console.log('Fetching a tier with a non-null governorate...');
        const tier = await Tiers.findOne({
            where: { gouvernorat: { [Op.ne]: null } },
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' }
            ]
        });

        if (tier) {
            console.log('Client:', tier.Raisoc);
            console.log('Gouvernorat ID:', tier.gouvernorat);
            console.log('Region Object:', JSON.stringify(tier.region, null, 2));
            console.log('SUCCESS: Associations working.');
        } else {
            console.log('No tiers with governorat found.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

sanityCheck();
