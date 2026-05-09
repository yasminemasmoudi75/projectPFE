
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TabFavd'
    `);
    console.log('Columns in TabFavd:');
    results.forEach(c => console.log(`- ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
