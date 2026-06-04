/**
 * Script utilitaire : activer le compte ahmed@gmail.com pour les tests
 * Usage : node scripts/activate-ahmed.js
 */
require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB établie');

    // 1. Trouver l'utilisateur
    const users = await sequelize.query(
      `SELECT USER_ID, USER_NAME FROM UCS_USERS WHERE LOWER(USER_NAME) = LOWER(:email)`,
      { replacements: { email: 'ahmed@gmail.com' }, type: QueryTypes.SELECT }
    );

    if (!users.length) {
      console.log('❌ Utilisateur ahmed@gmail.com introuvable dans UCS_USERS');
      console.log('\n📋 Liste des utilisateurs disponibles:');
      const all = await sequelize.query(
        `SELECT TOP 20 USER_ID, USER_NAME FROM UCS_USERS ORDER BY USER_ID DESC`,
        { type: QueryTypes.SELECT }
      );
      all.forEach(u => console.log(`  - ID:${u.USER_ID} | Email:${u.USER_NAME}`));
      process.exit(1);
    }

    const userId = users[0].USER_ID;
    console.log(`✅ Utilisateur trouvé: ID=${userId}`);

    // 2. Activer dans UCS_USERINFO (APP_ID = 1)
    const result = await sequelize.query(
      `UPDATE UCS_USERINFO SET USER_ACTIVE = 1, USER_IS_ADMIN = 1
       WHERE USER_ID = :userId AND APP_ID = 1`,
      { replacements: { userId }, type: QueryTypes.UPDATE }
    );
    console.log(`✅ Compte activé (admin) dans UCS_USERINFO`);

    // 3. Vérifier
    const check = await sequelize.query(
      `SELECT ui.USER_ACTIVE, ui.USER_IS_ADMIN, ui.PROF_ID
       FROM UCS_USERINFO ui WHERE ui.USER_ID = :userId AND ui.APP_ID = 1`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    console.log('📊 Statut après activation:', check[0] || 'aucune ligne dans UCS_USERINFO');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
})();
