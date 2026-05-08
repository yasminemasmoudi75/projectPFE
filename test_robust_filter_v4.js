const { DevisMaster, Tiers, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function test() {
  try {
    const statusWhere = {
        [Op.or]: [
          { bTransf: true },
          sequelize.where(sequelize.cast(sequelize.col('TabDevm.Nf'), 'VARCHAR'), { [Op.in]: sequelize.literal('(SELECT CodDev FROM TabBcvm WHERE CodDev IS NOT NULL)') })
        ]
      };

    console.log('Running query with TabDevm.Nf...');
    const rows = await DevisMaster.findAll({
      where: statusWhere,
      include: [{ model: Tiers, as: 'tiers' }],
      limit: 1,
      logging: (s) => console.log('SQL:', s)
    });
    console.log('SUCCESS! Found', rows.length, 'rows');
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    process.exit(0);
  }
}

test();
