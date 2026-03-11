const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');
const { ensureUserHasUserId } = require('./src/utils/userId');

(async () => {
  let transaction;

  try {
    transaction = await sequelize.transaction();

    const legacyUser = await User.findOne({
      where: { EmailPro: 'master' },
      transaction
    });

    if (!legacyUser) {
      throw new Error('Utilisateur legacy introuvable: master');
    }

    console.log('before =>', JSON.stringify({
      email: legacyUser.EmailPro,
      userId: legacyUser.UserID,
      guid: legacyUser.GUID
    }));

    await ensureUserHasUserId(User, legacyUser, { transaction });

    const refreshed = await User.findOne({
      where: { EmailPro: 'master' },
      transaction
    });

    console.log('after =>', JSON.stringify({
      email: refreshed?.EmailPro,
      userId: refreshed?.UserID,
      guid: refreshed?.GUID
    }));

    await transaction.rollback();
    console.log('rollback => done');
    process.exit(0);
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('rollback error =>', rollbackError);
      }
    }

    console.error('probe error =>', error);
    process.exit(1);
  }
})();

