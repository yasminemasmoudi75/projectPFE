const { sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function fix() {
  console.log('Activating BCV and BLV modules for Client role...');
  
  // Activate BCV module (CodMod=5) for Client
  await sequelize.query(
    "UPDATE TabAWProfileAccess SET Actif = 1 WHERE LOWER(ProfileUser) = 'client' AND CodMod = 5",
    { type: QueryTypes.UPDATE }
  );
  console.log('✅ BCV (CodMod=5) activated for Client');
  
  // Activate BLV module (CodMod=6) for Client
  await sequelize.query(
    "UPDATE TabAWProfileAccess SET Actif = 1 WHERE LOWER(ProfileUser) = 'client' AND CodMod = 6",
    { type: QueryTypes.UPDATE }
  );
  console.log('✅ BLV (CodMod=6) activated for Client');

  // Verify
  const perms = await sequelize.query(
    "SELECT CodMod, ProfileUser, Actif, canAdd, canEdit, canDelt FROM TabAWProfileAccess WHERE LOWER(ProfileUser) = 'client' AND CodMod IN (4,5,6,7) ORDER BY CodMod",
    { type: QueryTypes.SELECT }
  );
  console.log('\n--- Updated Client permissions for sales modules ---');
  console.log(JSON.stringify(perms, null, 2));
}

fix().catch(console.error).finally(() => process.exit());
