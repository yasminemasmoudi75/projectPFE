const app = require('./src/app');
const { testConnection } = require('./src/config/database');

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = { raw: text };
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data
  };
}

(async () => {
  let server;

  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    server = await new Promise((resolve) => {
      const instance = app.listen(3071, () => resolve(instance));
    });

    const loginResponse = await requestJson('http://localhost:3071/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        EmailPro: 'nexus@pfe.com',
        Password: 'Admin@123'
      })
    });

    console.log('login =>', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data?.data?.token;
    if (!token) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    const meResponse = await requestJson('http://localhost:3071/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('me =>', JSON.stringify(meResponse.data, null, 2));

    server.close(() => process.exit(0));
  } catch (error) {
    if (server) {
      server.close(() => {
        console.error('smoke error =>', error);
        process.exit(1);
      });
      return;
    }

    console.error('smoke error =>', error);
    process.exit(1);
  }
})();

