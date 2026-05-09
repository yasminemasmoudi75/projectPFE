const { sequelize } = require('./src/models');

async function testRel() {
  try {
    const reg = await sequelize.query(`
      SELECT top 5 r.IDReg, r.CUser, t.CodTiers, t.codRepresTiers
      FROM TabReg r
      LEFT JOIN TabTiers t ON r.CodTiers = t.CodTiers
      WHERE r.Payed = 1
    `, { type: sequelize.QueryTypes.SELECT });
    console.log(reg);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
testRel();
