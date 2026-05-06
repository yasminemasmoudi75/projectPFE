
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsIdentity') AS IsIdentity
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabDevm' AND COLUMN_NAME = 'Nf'
    `);
    console.table(results);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
