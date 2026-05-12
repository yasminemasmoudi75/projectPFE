const { sequelize } = require('../src/config/database');

async function checkTables() {
  const tables = ['UCS_PROFILES', 'TabAWProfileAccess', 'UCS_NOTIFICATIONS', 'tiersGouvernorat', 'TabRoleFilterVisibility'];
  for (const table of tables) {
    try {
      await sequelize.query(`SELECT TOP 1 * FROM ${table}`);
      console.log(`✅ ${table}: OK`);
    } catch (e) {
      console.log(`❌ ${table}: ERROR (${e.message})`);
    }
  }
  await sequelize.close();
}

checkTables();
