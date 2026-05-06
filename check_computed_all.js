
const { sequelize } = require('./src/models');

async function check() {
  try {
    const tables = ['TabDevd', 'TabBcvd', 'TabBlvd', 'TabFavd'];
    for (const table of tables) {
      const [results] = await sequelize.query(`
        SELECT 
          COLUMN_NAME, 
          COLUMNPROPERTY(object_id(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsComputed') AS IsComputed
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${table}' AND COLUMN_NAME IN ('MntHT', 'MntTVA', 'MntFodec', 'Tva', 'TVA')
      `);
      console.log(`IsComputed status for ${table}:`);
      results.forEach(r => console.log(`- ${r.COLUMN_NAME}: ${r.IsComputed}`));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
