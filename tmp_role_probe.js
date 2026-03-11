const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { status: response.status, data };
}

(async () => {
  try {
    const email = 'nexus@pfe.com';

    const ucsSql = `
      SELECT TOP 1
        u.USER_ID,
        u.USER_NAME,
        ui.PROF_ID,
        p.PROF_DESCRIPTION,
        ui.USER_IS_ADMIN,
        ui.USER_ACTIVE
      FROM UCS_USERS u
      LEFT JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
      LEFT JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
      WHERE u.USER_NAME = :email
    `;

    const secSql = `
      SELECT TOP 1 UserID, LoginName, UserRole
      FROM Sec_Users
      WHERE LoginName = :email OR EmailPro = :email
    `;

    const [ucsRows, secRows] = await Promise.all([
      sequelize.query(ucsSql, { replacements: { email }, type: QueryTypes.SELECT }),
      sequelize.query(secSql, { replacements: { email }, type: QueryTypes.SELECT })
    ]);

    console.log('UCS =>', JSON.stringify(ucsRows, null, 2));
    console.log('SEC =>', JSON.stringify(secRows, null, 2));

    const loginResponse = await requestJson('http://localhost:3066/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ EmailPro: email, Password: 'Admin@123' })
    });

    console.log('LOGIN =>', JSON.stringify(loginResponse, null, 2));

    const token = loginResponse.data?.data?.token;
    if (!token) {
      process.exit(0);
    }

    const reclamationsResponse = await requestJson('http://localhost:3066/api/reclamations?limit=1', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('RECLAMATIONS =>', JSON.stringify(reclamationsResponse, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

