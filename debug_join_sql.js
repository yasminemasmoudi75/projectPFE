const { Tiers, TiersClasse, TiersGouvernorat, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function debugSQL() {
    try {
        console.log('Debugging SQL join for Tiers and TiersGouvernorat...');
        const tier = await Tiers.findOne({
            where: { gouvernorat: { [Op.ne]: null } },
            include: [
                { model: TiersGouvernorat, as: 'region' }
            ],
            logging: (sql) => console.log('SQL QUERY:', sql)
        });

        if (tier) {
            console.log('Tier found:', tier.Raisoc);
            console.log('Gouvernorat ID:', tier.gouvernorat);
            console.log('Region data:', tier.region ? 'PRESENT' : 'MISSING');
            if (tier.region) {
                console.log('Libelle:', tier.region.libelle);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugSQL();
