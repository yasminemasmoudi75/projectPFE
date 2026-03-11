const axios = require('axios');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('./src/config/database');

const api = axios.create({ baseURL: process.env.API_BASE_URL || 'http://localhost:3066/api', timeout: 20000, validateStatus: () => true });

const desiredUsers = [
  { email: 'commercial@pfe.com', password: 'Commercial@123', role: 'Commercial', fullName: 'Compte Commercial' },
  { email: 'Agent@pfe.com', password: 'Agent@123', role: 'Agent', fullName: 'Compte Agent' },
  { email: 'Technicien@pfe.com', password: 'Technicien@123', role: 'Technicien', fullName: 'Compte Technicien' },
  { email: 'Client@pfe.com', password: 'Client@123', role: 'Client', fullName: 'Compte Client' }
];

const getErrorBody = (res) => {
  if (!res) return null;
  return typeof res.data === 'string' ? res.data : res.data || null;
};

async function adminLogin() {
  const res = await api.post('/auth/login', { EmailPro: 'nexus@pfe.com', Password: 'Admin@123' });
  if (res.status !== 200 || !res.data?.data?.token) {
    throw new Error(`Admin login failed: ${res.status} ${JSON.stringify(getErrorBody(res))}`);
  }
  return res.data.data.token;
}

async function upsertUsers(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const listRes = await api.get('/users', { headers });
  if (listRes.status !== 200 || !Array.isArray(listRes.data?.data)) {
    throw new Error(`Users fetch failed: ${listRes.status} ${JSON.stringify(getErrorBody(listRes))}`);
  }

  const existingByEmail = new Map();
  for (const user of listRes.data.data) {
    if (user?.EmailPro) existingByEmail.set(String(user.EmailPro).toLowerCase(), user);
  }

  const operations = [];
  for (const target of desiredUsers) {
    const existing = existingByEmail.get(target.email.toLowerCase());
    const createPayload = {
      LoginName: target.email,
      Password: target.password,
      FullName: target.fullName,
      EmailPro: target.email,
      UserRole: target.role,
      IsActive: true
    };
    const updatePayload = {
      FullName: target.fullName,
      EmailPro: target.email,
      Password: target.password,
      UserRole: target.role,
      IsActive: true
    };

    const res = existing
      ? await api.put(`/users/${existing.UserID}`, updatePayload, { headers })
      : await api.post('/users', createPayload, { headers });

    operations.push({
      email: target.email,
      role: target.role,
      mode: existing ? 'updated' : 'created',
      status: res.status,
      ok: res.status >= 200 && res.status < 300,
      body: getErrorBody(res)
    });
  }

  return operations;
}

async function verifyDb() {
  return sequelize.query(`
    SELECT
      u.USER_ID AS userId,
      u.USER_NAME AS loginName,
      ui.PROF_ID AS profileId,
      p.PROF_DESCRIPTION AS profileDescription,
      ui.USER_ACTIVE AS userActive,
      ui.USER_IS_ADMIN AS userIsAdmin
    FROM UCS_USERS u
    LEFT JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
    LEFT JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
    WHERE LOWER(u.USER_NAME) IN (:emails)
    ORDER BY u.USER_NAME
  `, {
    replacements: { emails: desiredUsers.map((u) => u.email.toLowerCase()) },
    type: QueryTypes.SELECT
  });
}

async function verifyLogin() {
  const results = [];
  for (const target of desiredUsers) {
    const res = await api.post('/auth/login', { EmailPro: target.email, Password: target.password });
    results.push({
      email: target.email,
      expectedRole: target.role,
      status: res.status,
      ok: res.status === 200,
      loginRole: res.data?.data?.user?.UserRole || null,
      message: res.data?.message || res.data?.error || null
    });
  }
  return results;
}

(async () => {
  try {
    const token = await adminLogin();
    const operations = await upsertUsers(token);
    const dbRows = await verifyDb();
    const logins = await verifyLogin();
    console.log(JSON.stringify({ operations, dbRows, logins }, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error.stack || error.message || error);
    process.exit(1);
  } finally {
    await sequelize.close().catch(() => {});
  }
})();

