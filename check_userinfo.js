const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function check() {
  try {
    const res = await sequelize.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'UCS_USERINFO'", { type: QueryTypes.SELECT });
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
