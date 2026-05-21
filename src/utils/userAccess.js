const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ROLE_LABELS = {
  admin: 'Admin',
  commercial: 'Commerciale',
  agent: 'Agent',
  technicien: 'Technicien',
  client: 'Client',
  user: 'User'
};

const ROLE_ALIASES = {
  admin: ['admin', 'administrateur'],
  commercial: ['commercial', 'commerciale'],
  agent: ['agent'],
  technicien: ['technicien', 'technicien sav'],
  client: ['client'],
  user: ['user', 'utilisateur']
};

const DEFAULT_PROFILE_IDS = {
  admin: 1,
  commercial: 2,
  technicien: 4,
  client: 7,
  agent: 8
};

const PROFILE_ID_TO_ROLE = Object.entries(DEFAULT_PROFILE_IDS).reduce((acc, [role, profileId]) => {
  acc[String(profileId)] = role;
  return acc;
}, {});

const normalizeRole = (role) => {
  const value = (role || '').toString().trim().toLowerCase();
  if (['admin', 'administrateur'].includes(value)) return 'admin';
  if (['commercial', 'commerciale'].includes(value)) return 'commercial';
  if (['agent'].includes(value)) return 'agent';
  if (['technicien', 'technicien sav'].includes(value)) return 'technicien';
  if (['client'].includes(value)) return 'client';
  if (['user', 'utilisateur'].includes(value)) return 'user';
  return value;
};

const getRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_LABELS[normalizedRole] || role || 'User';
};

const getRoleAliases = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_ALIASES[normalizedRole] || [normalizedRole];
};

const getRoleFromProfileId = (profileId) => {
  if (profileId == null) return null;
  return PROFILE_ID_TO_ROLE[String(profileId)] || null;
};

const canFlag = (value) => value === true || value === 1 || value === '1';

async function resolveUserAccess(userId, fallbackRole = 'User', options = {}) {
  if (!userId) {
    const normalizedRole = normalizeRole(fallbackRole) || 'user';
    return { found: false, role: getRoleLabel(normalizedRole), normalizedRole, isAdmin: normalizedRole === 'admin', isActive: true };
  }

  const rows = await sequelize.query(`
    SELECT TOP 1
      u.USER_ID AS UserID,
      ui.PROF_ID,
      p.PROF_DESCRIPTION,
      ui.USER_IS_ADMIN,
      ui.USER_ACTIVE
    FROM UCS_USERS u
    LEFT JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
    LEFT JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
    WHERE u.USER_ID = :userId
  `, {
    replacements: { userId },
    type: QueryTypes.SELECT,
    transaction: options.transaction
  });

  const row = rows[0] || null;
  const roleFromProfileId = getRoleFromProfileId(row?.PROF_ID);
  const rawRole = canFlag(row?.USER_IS_ADMIN)
    ? 'Admin'
    : (row?.PROF_DESCRIPTION || roleFromProfileId || fallbackRole || null);
  const normalizedRole = normalizeRole(rawRole);

  // USER_ACTIVE is only present when UCS_USERINFO exists (LEFT JOIN).
  // When null, the user has no UCS_USERINFO row — treat as active rather
  // than incorrectly hiding them as Inactif.
  const hasUserInfo = row?.PROF_ID != null || row?.USER_IS_ADMIN != null || row?.USER_ACTIVE != null;
  const isActive = hasUserInfo ? canFlag(row?.USER_ACTIVE) : true;

  return {
    found: Boolean(row),
    role: rawRole ? getRoleLabel(rawRole) : null,
    normalizedRole,
    profileId: row?.PROF_ID ?? null,
    profileDescription: row?.PROF_DESCRIPTION || (roleFromProfileId ? getRoleLabel(roleFromProfileId) : null),
    isAdmin: canFlag(row?.USER_IS_ADMIN) || normalizedRole === 'admin',
    isActive
  };
}

async function findProfileForRole(role, options = {}) {
  const normalizedRole = normalizeRole(role) || 'user';

  if (normalizedRole === 'user') {
    return { profileId: null, profileDescription: null };
  }

  const aliases = getRoleAliases(normalizedRole);
  const rows = await sequelize.query(`
    SELECT TOP 1 PROF_ID, PROF_DESCRIPTION
    FROM UCS_PROFILES
    WHERE LOWER(PROF_DESCRIPTION) IN (:aliases)
    ORDER BY CASE WHEN LOWER(PROF_DESCRIPTION) = :preferredRole THEN 0 ELSE 1 END, PROF_ID
  `, {
    replacements: { aliases, preferredRole: normalizedRole },
    type: QueryTypes.SELECT,
    transaction: options.transaction
  });

  const profile = rows[0];
  if (profile) {
    return {
      profileId: profile.PROF_ID,
      profileDescription: profile.PROF_DESCRIPTION
    };
  }

  const fallbackProfileId = DEFAULT_PROFILE_IDS[normalizedRole] || null;
  return {
    profileId: fallbackProfileId,
    profileDescription: fallbackProfileId ? getRoleLabel(normalizedRole) : null
  };
}

async function upsertUserAccess(userId, role = 'User', options = {}) {
  if (!userId) {
    throw new Error('UserID is required to sync user access');
  }

  const normalizedRole = normalizeRole(role) || 'user';
  let profileId = null;
  let profileDescription = null;

  if (normalizedRole !== 'user') {
    const profile = await findProfileForRole(normalizedRole, options);
    profileId = profile.profileId;
    profileDescription = profile.profileDescription;
  }

  if (normalizedRole !== 'user' && !profileId) {
    throw new Error(`Aucun profil UCS_PROFILES trouvé pour le rôle ${role}`);
  }

  const userActive = options.isActive === false ? '0' : '1';
  const userIsAdmin = normalizedRole === 'admin' ? '1' : '0';

  await sequelize.query(`
    IF EXISTS (SELECT 1 FROM UCS_USERINFO WHERE APP_ID = 1 AND USER_ID = :userId)
    BEGIN
      UPDATE UCS_USERINFO
      SET PROF_ID = :profileId,
          USER_ACTIVE = :userActive,
          USER_IS_ADMIN = :userIsAdmin,
          USER_EXPIRE = '0'
      WHERE APP_ID = 1 AND USER_ID = :userId
    END
    ELSE
    BEGIN
      INSERT INTO UCS_USERINFO (
        APP_ID, USER_ID, PROF_ID, USER_ACTIVE, USER_IS_ADMIN, EXPIRATION_DATE, USER_EXPIRE, ADDITIONAL_INFO
      )
      VALUES (1, :userId, :profileId, :userActive, :userIsAdmin, 50000, '0', '')
    END
  `, {
    replacements: { userId, profileId, userActive, userIsAdmin },
    transaction: options.transaction
  });

  return {
    role: getRoleLabel(profileDescription || role),
    normalizedRole,
    profileId,
    isAdmin: userIsAdmin === '1',
    isActive: userActive === '1'
  };
}

async function upsertAdminAccess(userId, options = {}) {
  return upsertUserAccess(userId, 'Admin', { ...options, isActive: true });
}

async function attachAccessToUser(user, options = {}) {
  if (!user) return user;

  const access = await resolveUserAccess(user.UserID, user.UserRole, options);
  user.setDataValue('UserRole', access.role);
  user.setDataValue('IsActive', access.isActive);
  return user;
}

async function attachAccessToUsers(users, options = {}) {
  const result = [];
  const batchSize = 20;
  for (let i = 0; i < (users || []).length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map((user) => attachAccessToUser(user, options)));
    for (let j = 0; j < batchResults.length; j++) {
      if (batchResults[j].status === 'fulfilled') {
        result.push(batchResults[j].value);
      } else {
        const u = batch[j];
        if (u) {
          u.setDataValue('UserRole', 'User');
          u.setDataValue('IsActive', false);
          result.push(u);
        }
      }
    }
  }
  return result;
}

module.exports = {
  normalizeRole,
  resolveUserAccess,
  findProfileForRole,
  upsertUserAccess,
  upsertAdminAccess,
  attachAccessToUser,
  attachAccessToUsers,
  canFlag,
  getRoleLabel,
  getRoleAliases
};

