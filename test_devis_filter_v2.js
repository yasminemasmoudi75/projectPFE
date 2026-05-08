const { DevisMaster, Tiers, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function test() {
  try {
    const status = 'converted';
    let statusWhere = {
        [Op.or]: [
          { bTransf: true },
          sequelize.literal(`EXISTS (SELECT 1 FROM TabBcvm WHERE CodDev = CAST(TabDevm.Nf AS VARCHAR(20)))`),
          sequelize.literal(`EXISTS (SELECT 1 FROM TabBlvm WHERE CodDev = CAST(TabDevm.Nf AS VARCHAR(20)))`),
          sequelize.literal(`EXISTS (SELECT 1 FROM TabFavm WHERE CodDev = CAST(TabDevm.Nf AS VARCHAR(20)))`)
        ]
      };

    const results = await DevisMaster.findAll({
      where: statusWhere,
      include: [{ model: Tiers, as: 'tiers' }],
      limit: 1
    });
    console.log('Success!');
  } catch (err) {
    console.error('FAILED:', err.message);
    if (err.parent) console.error('DB Error:', err.parent.message);
  } finally {
    process.exit(0);
  }
}

test();
