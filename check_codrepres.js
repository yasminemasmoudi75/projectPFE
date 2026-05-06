
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabDevm' AND COLUMN_NAME IN ('CodRepres', 'CUser', 'CodMag', 'CodDev')
    `);
    console.log('Column sizes in TabDevm:');
    console.table(results);

    // Also check what codRepresTiers looks like for the test tier
    const [tierData] = await sequelize.query(`
      SELECT TOP 5 CodTiers, codRepresTiers FROM TabTiers WHERE codRepresTiers IS NOT NULL AND codRepresTiers <> ''
    `);
    console.log('Sample codRepresTiers values:');
    console.table(tierData);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
