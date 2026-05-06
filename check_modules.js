const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkValues() {
  try {
    const modules = await sequelize.query(`
      SELECT DISTINCT CodMod, LibMod
      FROM TabAWProfileAccess
      ORDER BY CodMod
    `, { type: QueryTypes.SELECT });
    
    console.log('Modules in TabAWProfileAccess:');
    modules.forEach(m => console.log(`${m.CodMod}: ${m.LibMod}`));
  } catch (error) {
    console.error('Error checking values:', error);
  } finally {
    process.exit();
  }
}

checkValues();
