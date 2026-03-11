const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const normalizeUserId = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
};

const allocateNextUserId = async ({ transaction } = {}) => {
  const rows = await sequelize.query(
    `SELECT ISNULL(MAX(USER_ID), 0) + 1 AS nextUserId
     FROM UCS_USERS WITH (UPDLOCK, HOLDLOCK)
     WHERE USER_ID IS NOT NULL`,
    {
      type: QueryTypes.SELECT,
      transaction
    }
  );

  const nextUserId = normalizeUserId(rows[0]?.nextUserId);

  if (nextUserId === null) {
    throw new Error('Impossible de générer un USER_ID valide');
  }

  return nextUserId;
};

const ensureUserHasUserId = async (UserModel, user, { transaction } = {}) => {
  if (!user) {
    return user;
  }

  const existingUserId = normalizeUserId(user.UserID);
  if (existingUserId !== null) {
    user.UserID = existingUserId;
    return user;
  }

  const lookupWhere = {};
  const updateWhere = { UserID: null };

  if (user.EmailPro) {
    lookupWhere.EmailPro = user.EmailPro;
    updateWhere.EmailPro = user.EmailPro;
  } else if (user.GUID) {
    lookupWhere.GUID = user.GUID;
    updateWhere.GUID = user.GUID;
  } else {
    throw new Error('Impossible d’identifier un utilisateur sans USER_ID');
  }

  const nextUserId = await allocateNextUserId({ transaction });
  const [updatedCount] = await UserModel.update(
    { UserID: nextUserId },
    { where: updateWhere, transaction }
  );

  if (!updatedCount) {
    throw new Error('Impossible d’assigner un USER_ID à cet utilisateur');
  }

  const repairedUser = await UserModel.findOne({
    where: lookupWhere,
    transaction
  });

  user.UserID = normalizeUserId(repairedUser?.UserID);

  if (user.UserID === null) {
    throw new Error('USER_ID toujours invalide après réparation');
  }

  return user;
};

module.exports = {
  allocateNextUserId,
  ensureUserHasUserId,
  normalizeUserId
};