const { Tiers, TiersClasse, TiersGouvernorat, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function deepCheck() {
    try {
        console.log('Fetching tier with associations...');
        const tier = await Tiers.findOne({
            where: { gouvernorat: { [Op.ne]: null } },
            include: [
                { model: TiersClasse, as: 'tiersClasse' },
                { model: TiersGouvernorat, as: 'region' }
            ]
        });

        if (tier) {
            const raw = tier.toJSON();
            console.log('--- RAW JSON DATA ---');
            console.log(JSON.stringify(raw, null, 2));
            console.log('---------------------');
            console.log('gouvernorat (field):', raw.gouvernorat);
            console.log('region (association):', raw.region ? 'EXISTS' : 'NULL');
            console.log('Ville (field):', raw.Ville);
        } else {
            console.log('No tier with governorate found.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

deepCheck();
