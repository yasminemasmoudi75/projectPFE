const { DevisMaster, Tiers, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function test() {
  try {
    const status = 'converted';
    // Using the same literal as in devisController.js
    let statusWhere = sequelize.literal(`(
        bTransf = 1 OR 
        EXISTS (SELECT 1 FROM TabBcvm WHERE CodDev = CAST(Nf AS VARCHAR(20))) OR
        EXISTS (SELECT 1 FROM TabBlvm WHERE CodDev = CAST(Nf AS VARCHAR(20))) OR
        EXISTS (SELECT 1 FROM TabFavm WHERE CodDev = CAST(Nf AS VARCHAR(20)))
      )`);

    console.log('Running query...');
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
