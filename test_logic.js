const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function testControllerLogic() {
  try {
    const user = { UserID: 18, GUID: 'some-guid' };
    const permissions = { FiltreRepres: 1 };
    
    console.log('Testing Objectif logic...');
    // Simulate buildCommercialObjectifScope
    const where = permissions.FiltreRepres ? { IdCont: user.GUID } : {};
    console.log('Where clause:', where);
    
    const { Objectif } = require('./src/models');
    const result = await Objectif.findAll({ where, limit: 1 });
    console.log('Objectif query successful');
    
    console.log('Testing User logic...');
    const { User } = require('./src/models');
    const users = await User.findAll({ limit: 1 });
    console.log('User query successful');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    process.exit();
  }
}

testControllerLogic();
