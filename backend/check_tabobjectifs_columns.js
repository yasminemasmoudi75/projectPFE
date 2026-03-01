const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TabObjectifs'");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
})();
