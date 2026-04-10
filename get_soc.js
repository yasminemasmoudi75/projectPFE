const { sequelize, TabSociete } = require('./src/models');
async function getInfo() {
    const soc = await TabSociete.findOne();
    console.log(JSON.stringify(soc, null, 2));
}
getInfo().catch(console.error).finally(() => process.exit());
