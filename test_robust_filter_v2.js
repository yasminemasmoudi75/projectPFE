const { DevisMaster, Tiers, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function test() {
  try {
    const statusWhere = {
        [Op.or]: [
          { bTransf: true },
          sequelize.where(sequelize.cast(sequelize.col('Nf'), 'VARCHAR'), { [Op.in]: sequelize.literal('(SELECT CodDev FROM TabBcvm WHERE CodDev IS NOT NULL)') }),
          sequelize.where(sequelize.cast(sequelize.col('Nf'), 'VARCHAR'), { [Op.in]: sequelize.literal('(SELECT CodDev FROM TabBlvm WHERE CodDev IS NOT NULL)') }),
          sequelize.where(sequelize.cast(sequelize.col('Nf'), 'VARCHAR'), { [Op.in]: sequelize.literal('(SELECT CodDev FROM TabFavm WHERE CodDev IS NOT NULL)') })
        ]
      };

    console.log('Running query with include...');
    const rows = await DevisMaster.findAll({
      where: statusWhere,
      include: [{ model: Tiers, as: 'tiers' }],
      limit: 1,
      logging: (s) => console.log('SQL:', s)
    });
    console.log('SUCCESS! Found', rows.length, 'rows');
  } catch (err) {
    console.error('FAILED:', err.message);
    if (err.parent) console.error('DB Error:', err.parent.message);
  } finally {
    process.exit(0);
  }
}

test();
