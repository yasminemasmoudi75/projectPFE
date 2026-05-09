
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabDevd' AND COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsComputed') = 1
    `);
    console.log('ALL computed columns in TabDevd:');
    console.table(results);
    
    const [resultsMaster] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabDevm' AND COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsComputed') = 1
    `);
    console.log('ALL computed columns in TabDevm:');
    console.table(resultsMaster);

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
