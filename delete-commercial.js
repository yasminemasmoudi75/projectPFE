const { sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function deleteOldCommercial() {
  try {
    const [results, metadata] = await sequelize.query(
      `DELETE FROM TabAWProfileAccess WHERE ProfileUser = 'Commercial'`, 
      { type: QueryTypes.DELETE }
    );
    console.log('Old Commercial roles deleted successfully! Metadata:', metadata);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

deleteOldCommercial();
