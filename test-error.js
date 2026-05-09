const { sequelize, User } = require('./src/models');
const { Op, QueryTypes } = require('sequelize');
const filterHelper = require('./src/utils/filterHelper');

async function test() {
  try {
    const user = await User.findByPk(1); // admin
    const req = { query: { CommercialID: '18' }, user };
    
    const queryForPermissions = { ...req.query };
    delete queryForPermissions.Date;
    delete queryForPermissions.DateFrom;
    delete queryForPermissions.DateTo;
    delete queryForPermissions.CommercialID;

    const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
        '31',
        queryForPermissions,
        req.user
    );

    console.log('WHERE before:', Object.getOwnPropertySymbols(where));

    const clientRows = await sequelize.query(`
        SELECT CodTiers
        FROM TabTiers
        WHERE CONVERT(VARCHAR, codRepresTiers) = :commercialId
    `, {
        replacements: { commercialId: String(req.query.CommercialID) },
        type: QueryTypes.SELECT
    });
    
    const clientCodes = clientRows.map(r => r.CodTiers).filter(Boolean);
    console.log('clientCodes', clientCodes);

    if (clientCodes.length > 0) {
        where[Op.and] = [...(where[Op.and] || []), { CodTiers: { [Op.in]: clientCodes } }];
    } else {
        where[Op.and] = [...(where[Op.and] || []), sequelize.literal('1 = 0')];
    }
    
    console.log('WHERE after:', where);
    console.log('Op.and value:', where[Op.and]);

    const Reclamation = require('./src/models/Reclamation');
    const { count, rows } = await Reclamation.findAndCountAll({
        where,
        limit,
        offset
    });
    console.log('SUCCESS, found:', count);
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
}
test();
