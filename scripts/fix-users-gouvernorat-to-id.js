const { sequelize } = require('../src/models');
const { QueryTypes } = require('sequelize');

async function main() {
  console.log('Starting UCS_USERS.Gouvernorat normalization to tiersGouvernorat.id...');

  // Preview rows that are not already numeric IDs.
  const preview = await sequelize.query(`
    SELECT TOP 200
      u.USER_ID,
      u.USER_NAME,
      u.REAL_NAME,
      u.Gouvernorat
    FROM UCS_USERS u
    WHERE u.Gouvernorat IS NOT NULL
      AND LTRIM(RTRIM(CONVERT(NVARCHAR(100), u.Gouvernorat))) <> ''
      AND TRY_CONVERT(INT, u.Gouvernorat) IS NULL
    ORDER BY u.USER_ID ASC
  `, { type: QueryTypes.SELECT });

  console.log(`Rows with non-numeric Gouvernorat (sample up to 200): ${preview.length}`);

  const [result] = await sequelize.query(`
    UPDATE u
    SET u.Gouvernorat = CONVERT(NVARCHAR(100), tg.id)
    FROM UCS_USERS u
    INNER JOIN tiersGouvernorat tg
      ON LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), u.Gouvernorat)))) = LOWER(LTRIM(RTRIM(tg.libelle)))
    WHERE u.Gouvernorat IS NOT NULL
      AND LTRIM(RTRIM(CONVERT(NVARCHAR(100), u.Gouvernorat))) <> ''
      AND TRY_CONVERT(INT, u.Gouvernorat) IS NULL
  `);

  const updated = result?.rowsAffected?.[0] ?? 0;
  console.log(`Updated rows: ${updated}`);

  const unresolved = await sequelize.query(`
    SELECT TOP 200
      u.USER_ID,
      u.USER_NAME,
      u.REAL_NAME,
      u.Gouvernorat
    FROM UCS_USERS u
    WHERE u.Gouvernorat IS NOT NULL
      AND LTRIM(RTRIM(CONVERT(NVARCHAR(100), u.Gouvernorat))) <> ''
      AND TRY_CONVERT(INT, u.Gouvernorat) IS NULL
    ORDER BY u.USER_ID ASC
  `, { type: QueryTypes.SELECT });

  console.log(`Remaining unresolved rows (sample up to 200): ${unresolved.length}`);
  if (unresolved.length) {
    console.log('Sample unresolved values:', unresolved.slice(0, 20));
  }

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Normalization failed:', error);
  try {
    await sequelize.close();
  } catch (_) {
    // ignore close errors
  }
  process.exit(1);
});
