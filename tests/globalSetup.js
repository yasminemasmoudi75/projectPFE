/**
 * jest globalSetup — un seul login admin avant tous les tests.
 * Le token est sauvegardé dans .test-auth.json pour être lu par chaque fichier de test.
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '../.test-auth.json');

module.exports = async () => {
  const api = axios.create({
    baseURL: 'http://localhost:3066/api',
    validateStatus: () => true,
    timeout: 15000,
  });

  // Vérifier que le backend est démarré
  const ping = await api.get('/auth/me').catch(() => null);
  if (!ping) {
    throw new Error('❌ Backend inaccessible sur http://localhost:3066. Lancez: npm run dev');
  }

  // Login unique (évite le rate limiting sur /auth/login)
  const res = await api.post('/auth/login', {
    EmailPro: 'ahmed@gmail.com',
    Password: 'Aa123456?',
  });

  if (res.status !== 200 || !res.data?.data?.token) {
    throw new Error(
      `❌ Connexion admin échouée (${res.status}): ${JSON.stringify(res.data)}\n` +
      '→ Relancez le backend pour réinitialiser le rate limit, ou vérifiez les identifiants.'
    );
  }

  const { token } = res.data.data;
  const userId = res.data.data.user?.UserID;

  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, userId }));
  console.log(`\n✅ [globalSetup] Admin connecté (UserID: ${userId})\n`);
};
