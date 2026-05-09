const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function checkViewRequirements() {
  const tablesToCheck = [
    'TabTiersContactCrm',
    'tabdevm',
    'tabbcvm',
    'tabblvm',
    'tabfavm',
    'tablinkeddoc'
  ];
  
  const viewsToCheck = ['ViewBlFacture'];

  try {
    console.log('🔍 Vérification des pré-requis pour la Vue...');
    
    for (const table of tablesToCheck) {
      const result = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = :table
      `, { replacements: { table }, type: QueryTypes.SELECT });
      console.log(`${table}: ${result.length > 0 ? '✅ Présente' : '❌ Absente'}`);
    }

    for (const view of viewsToCheck) {
      const result = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.VIEWS 
        WHERE TABLE_NAME = :view
      `, { replacements: { view }, type: QueryTypes.SELECT });
      console.log(`Vue ${view}: ${result.length > 0 ? '✅ Présente' : '❌ Absente'}`);
    }

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error.message);
  } finally {
    process.exit();
  }
}

checkViewRequirements();
