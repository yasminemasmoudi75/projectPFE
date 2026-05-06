
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabDevd' AND COLUMN_NAME IN ('MntTVA', 'MntFodec', 'MntHT', 'Qt', 'PuHT')
    `);
    console.table(results);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
