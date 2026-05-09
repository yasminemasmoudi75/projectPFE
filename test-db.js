const { sequelize } = require('./src/models');

async function test() {
  try {
    const tableInfo = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Objectif'
    `, { type: sequelize.QueryTypes.SELECT });
    console.log("Objectif columns:", tableInfo);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
