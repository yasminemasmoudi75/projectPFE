
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsComputed') AS IsComputed
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabBcvd' AND COLUMN_NAME IN ('MntTVA', 'MntHT', 'MntFodec', 'MntRem', 'MntFrais')
    `);
    console.log('Computed columns in TabBcvd:');
    console.table(results);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
