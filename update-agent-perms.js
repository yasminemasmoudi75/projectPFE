const { sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function updatePermissions() {
  try {
    await sequelize.query(
      `UPDATE TabAWProfileAccess 
       SET Actif = 1, canAdd = 1, canEdit = 1, canDelt = 1, FiltreRepres = 1 
       WHERE ProfileUser = 'Agent' AND CodMod IN (3, 45)`, 
      { type: QueryTypes.UPDATE }
    );
    console.log('Permissions updated successfully!');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

updatePermissions();
