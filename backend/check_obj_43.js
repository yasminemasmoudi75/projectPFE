const { sequelize } = require('./src/config/database');
const { Objectif } = require('./src/models');

(async () => {
  try {
    await sequelize.authenticate();
    const obj = await Objectif.findByPk(43);
    console.log(JSON.stringify(obj, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
})();
