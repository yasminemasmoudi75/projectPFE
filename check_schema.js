const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkSchema() {
  try {
    const columns = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TabAWProfileAccess'
    `, { type: QueryTypes.SELECT });
    
    console.log('Columns in TabAWProfileAccess:');
    console.log(columns.map(c => c.COLUMN_NAME).join(', '));
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    process.exit();
  }
}

checkSchema();
