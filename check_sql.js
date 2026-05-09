const { DevisMaster, Tiers, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function test() {
  try {
    const status = 'converted';
    let statusWhere = {
        [Op.or]: [
          { bTransf: true },
          sequelize.literal(`EXISTS (SELECT 1 FROM TabBcvm WHERE CodDev = CAST(DevisMaster.Nf AS VARCHAR(20)))`)
        ]
      };

    const sql = await DevisMaster.findAll({
      where: statusWhere,
      include: [{ model: Tiers, as: 'tiers' }],
      limit: 1,
      logging: (s) => console.log('SQL:', s)
    });
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    process.exit(0);
  }
}

test();
