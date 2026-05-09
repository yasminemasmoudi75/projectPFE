
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsComputed') AS IsComputed
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabDevd' AND COLUMN_NAME IN ('MntHT', 'MntTVA', 'MntFodec')
    `);
    console.log('IsComputed status for TabDevd:');
    results.forEach(r => console.log(`- ${r.COLUMN_NAME}: ${r.IsComputed}`));

    const [resultsBcv] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsComputed') AS IsComputed
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabBcvd' AND COLUMN_NAME IN ('MntHT', 'MntTVA', 'MntFodec')
    `);
    console.log('IsComputed status for TabBcvd:');
    resultsBcv.forEach(r => console.log(`- ${r.COLUMN_NAME}: ${r.IsComputed}`));

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
