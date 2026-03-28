const { Tiers, TiersClasse, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function checkUpdated() {
    try {
        console.log('Searching for a tier with a non-null Classe...');
        const tier = await Tiers.findOne({
            where: { Classe: { [Op.ne]: null } },
            include: [{ model: TiersClasse, as: 'tiersClasse' }]
        });

        if (tier) {
            console.log('SUCCESS: Found updated tier.');
            console.log('Client:', tier.Raisoc);
            console.log('Classe ID:', tier.Classe);
            console.log('tiersClasse Association:', JSON.stringify(tier.tiersClasse, null, 2));
        } else {
            console.log('FAILURE: No tiers found with a Classe ID.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkUpdated();
