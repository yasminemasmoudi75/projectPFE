const { sequelize } = require('./src/models');

async function checkReg() {
  try {
    const reg = await sequelize.query(`
      SELECT TOP 5 IDReg, IDContact, CUser, CodTiers, DatReg, MntReg, Payed
      FROM TabReg
      ORDER BY DatReg DESC
    `, { type: sequelize.QueryTypes.SELECT });
    console.log(reg);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
checkReg();
