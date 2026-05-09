
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabDevd' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL
    `);
    console.log('NOT NULL columns in TabDevd without default:');
    console.table(results);
    
    const [resultsMaster] = await sequelize.query(`
      SELECT 
        COLUMN_NAME, 
        IS_NULLABLE, 
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'TabDevm' AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL
    `);
    console.log('NOT NULL columns in TabDevm without default:');
    console.table(resultsMaster);

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
