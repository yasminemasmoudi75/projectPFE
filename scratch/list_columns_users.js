const { sequelize } = require('../src/config/database');

async function listColumns() {
  try {
    const [results] = await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UCS_USERS'");
    console.log('Columns in UCS_USERS:', results.map(r => r.COLUMN_NAME));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

listColumns();
