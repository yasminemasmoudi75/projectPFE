const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkSchema() {
  try {
    const columns = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'UCS_USERS'
    `, { type: QueryTypes.SELECT });
    
    console.log('Columns in UCS_USERS:');
    columns.forEach(c => console.log(`${c.COLUMN_NAME}: ${c.DATA_TYPE}`));
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    process.exit();
  }
}

checkSchema();
