const { DevisMaster, Tiers, TiersClasse, TiersGouvernorat, TiersCategorie, sequelize } = require('./src/models');
const { Op, TableHints } = require('sequelize');

async function test() {
  try {
    const statusWhere = {
        [Op.or]: [
          { bTransf: true },
          sequelize.where(sequelize.cast(sequelize.col('TabDevm.Nf'), 'VARCHAR'), { [Op.in]: sequelize.literal('(SELECT CodDev FROM TabBcvm WHERE CodDev IS NOT NULL)') }),
          sequelize.where(sequelize.cast(sequelize.col('TabDevm.Nf'), 'VARCHAR'), { [Op.in]: sequelize.literal('(SELECT CodDev FROM TabBlvm WHERE CodDev IS NOT NULL)') }),
          sequelize.where(sequelize.cast(sequelize.col('TabDevm.Nf'), 'VARCHAR'), { [Op.in]: sequelize.literal('(SELECT CodDev FROM TabFavm WHERE CodDev IS NOT NULL)') })
        ]
      };

    const listWhere = {
      [Op.and]: [{}, statusWhere]
    };

    console.log('Running query with findAndCountAll...');
    const result = await DevisMaster.findAndCountAll({
      where: listWhere,
      include: [{
        model: Tiers,
        as: 'tiers',
        attributes: ['Raisoc', 'CodTiers', 'Ville', 'MapsRegion', 'Gouvernorat', 'Classe', 'Categorie'],
        include: [
          { model: TiersClasse, as: 'tiersClasse', attributes: ['id', 'libelle'], required: false },
          { model: TiersGouvernorat, as: 'region', attributes: ['id', 'libelle'], required: false },
          { model: TiersCategorie, as: 'tiersCategorieObj', attributes: ['id', 'libelle'], required: false }
        ]
      }],
      order: [['Nf', 'DESC']],
      limit: 10,
      offset: 0,
      distinct: false,
      tableHint: TableHints.NOLOCK
    });
    console.log('SUCCESS! count:', result.count, 'rows:', result.rows.length);
  } catch (err) {
    console.error('FAILED:', err.message);
    if (err.parent) console.error('DB Error:', err.parent.message);
  } finally {
    process.exit(0);
  }
}

test();
