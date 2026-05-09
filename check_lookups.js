
const { sequelize } = require('./src/models');

async function check() {
  try {
    const [classes] = await sequelize.query("SELECT id, libelle FROM tiersClasse");
    console.log('Valid Classes:');
    console.table(classes);
    
    const [categories] = await sequelize.query("SELECT id, libelle FROM tiersCategorie");
    console.log('Valid Categories:');
    console.table(categories);

    const [gouvernorats] = await sequelize.query("SELECT id, libelle FROM tiersGouvernorat");
    console.log('Valid Gouvernorats:');
    console.table(gouvernorats);

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
check();
