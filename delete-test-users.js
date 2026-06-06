const { sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

const TEST_PATTERNS = [
  'Nouveau Collaborateur',
  'Nouveau Commercial',
  'Ahmed Test',
  'Ahmed Deactivation',
];

async function run() {
  try {
    // Build WHERE clause
    const conditions = TEST_PATTERNS.map(
      (_, i) => `LOWER(LTRIM(RTRIM(u.REAL_NAME))) LIKE LOWER(:p${i})`
    ).join(' OR ');

    const replacements = {};
    TEST_PATTERNS.forEach((p, i) => { replacements[`p${i}`] = `%${p}%`; });

    // Preview
    const toDelete = await sequelize.query(
      `SELECT u.USER_ID, u.USER_NAME, u.REAL_NAME
       FROM UCS_USERS u
       WHERE ${conditions}
       ORDER BY u.REAL_NAME`,
      { replacements, type: QueryTypes.SELECT }
    );

    if (toDelete.length === 0) {
      console.log('Aucun utilisateur test trouvé.');
      return;
    }

    console.log(`\nUtilisateurs à supprimer (${toDelete.length}) :`);
    toDelete.forEach(u => console.log(`  [${u.USER_ID}] ${u.REAL_NAME} (login: ${u.USER_NAME})`));

    // Delete
    const ids = toDelete.map(u => u.USER_ID);
    await sequelize.query(
      `DELETE FROM UCS_USERS WHERE USER_ID IN (:ids)`,
      { replacements: { ids }, type: QueryTypes.DELETE }
    );

    console.log(`\n✓ ${toDelete.length} utilisateur(s) supprimé(s) avec succès.`);
  } catch (e) {
    console.error('Erreur :', e.message);
  } finally {
    process.exit(0);
  }
}

run();
