const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkTable() {
  try {
    const tables = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'tiersGouvernorat'
    `, { type: QueryTypes.SELECT });
    
    console.log('Tables matching tiersGouvernorat:', tables.length);
  } catch (error) {
    console.error('Error checking table:', error);
  } finally {
    process.exit();
  }
}

checkTable();
