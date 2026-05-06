const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkType() {
  try {
    const types = await sequelize.query(`
      SELECT DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'TabAWProfileAccess' AND COLUMN_NAME = 'CodMod'
    `, { type: QueryTypes.SELECT });
    
    console.log('Type of CodMod:', types[0]?.DATA_TYPE);
  } catch (error) {
    console.error('Error checking type:', error);
  } finally {
    process.exit();
  }
}

checkType();
