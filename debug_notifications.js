const { Message, sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function debug() {
  try {
    console.log('--- Debug MSGMessages ---');
    const messages = await sequelize.query('SELECT TOP 5 * FROM MSGMessages ORDER BY SendingDate DESC', { type: QueryTypes.SELECT });
    console.log('Recent Messages:', JSON.stringify(messages, null, 2));

    console.log('--- Debug Admins ---');
    const admins = await sequelize.query(`
      SELECT ui.USER_ID, ui.PROF_ID, ui.USER_IS_ADMIN, ui.USER_ACTIVE
      FROM UCS_USERINFO ui
      WHERE ui.USER_ACTIVE = '1'
    `, { type: QueryTypes.SELECT });
    console.log('Active UserInfo:', JSON.stringify(admins, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
