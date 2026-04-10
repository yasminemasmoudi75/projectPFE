const { Op, QueryTypes } = require('sequelize');
const { TabRoleFilterVisibility, sequelize } = require('../models');

const RESERVED_QUERY_KEYS = new Set([
  'page',
  'limit',
  'offset',
  'perPage',
  'sort',
  'order',
  'direction',
  'search',
  'q',
  'userId',
  'module',
  'moduleCode',
  'include',
  'fields',
  'expand',
]);

const isFilterableField = (key) => {
  if (!key || RESERVED_QUERY_KEYS.has(key)) return false;
  // Basic protection: only allow simple field names, block nested keys/operators.
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
};

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (['admin', 'administrateur'].includes(value)) return 'admin';
  if (['commercial', 'commerciale'].includes(value)) return 'commercial';
  if (['agent'].includes(value)) return 'agent';
  if (['technicien', 'technicien sav'].includes(value)) return 'technicien';
  if (['client'].includes(value)) return 'client';
  return value;
};

const roleAliases = (normalizedRole) => {
  const aliases = {
    admin: ['admin', 'administrateur'],
    commercial: ['commercial', 'commerciale'],
    agent: ['agent'],
    technicien: ['technicien', 'technicien sav'],
    client: ['client']
  };
  return aliases[normalizedRole] || [normalizedRole];
};

const hasWhereConditions = (whereObj) => {
  if (!whereObj) return false;
  if (Object.keys(whereObj).length > 0) return true;
  if (Object.getOwnPropertySymbols(whereObj).length > 0) return true;
  return false;
};

const getUserIdentifiers = (user = {}) => {
  const values = [
    user?.CodRepres,
    user?.codRepres,
    user?.COD_REPRES,
    user?.UserID,
    user?.id,
    user?.USER_ID,
    user?.LoginName,
    user?.EmailPro,
    user?.USER_NAME,
    user?.FullName,
    user?.REAL_NAME,
    user?.GUID,
  ];

  return Array.from(new Set(
    values
      .map((value) => (value === null || value === undefined ? null : String(value).trim().toLowerCase()))
      .filter(Boolean)
  ));
};

const getFiltreRepresEnabled = async (moduleCode, userRole) => {
  const normalizedRole = normalizeRole(userRole);
  const aliases = roleAliases(normalizedRole);

  const moduleCandidates = [String(moduleCode)];
  // Clients module can exist as 11 or 30 in legacy datasets.
  if (String(moduleCode) === '11' || String(moduleCode) === '30') {
    moduleCandidates.push('11', '30');
  }

  const rows = await sequelize.query(`
    SELECT TOP 1 FiltreRepres, ProfileUser, CodMod
    FROM TabAWProfileAccess
    WHERE LOWER(ProfileUser) IN (:aliases)
      AND CAST(CodMod AS NVARCHAR(20)) IN (:moduleCandidates)
    ORDER BY CASE WHEN CAST(CodMod AS NVARCHAR(20)) = :preferredModule THEN 0 ELSE 1 END
  `, {
    replacements: {
      aliases,
      moduleCandidates: Array.from(new Set(moduleCandidates)),
      preferredModule: String(moduleCode)
    },
    type: QueryTypes.SELECT
  });

  console.log(`🔍 [filterHelper] getFiltreRepresEnabled result:`, rows[0]);
  const enabled = rows[0]?.FiltreRepres === 1 || rows[0]?.FiltreRepres === true || rows[0]?.FiltreRepres === '1';
  console.log(`   - Enabled: ${enabled}`);
  return enabled;
};

const getRepresentativeScope = async (user = {}, normalizedRole = '') => {
  const ownIdentifiers = getUserIdentifiers(user);
  const userRegion = user?.Gouvernorat ?? user?.gouvernorat ?? null;

  if (normalizedRole === 'commercial') {
    return ownIdentifiers;
  }

  if (normalizedRole !== 'agent') {
    return ownIdentifiers;
  }

  // Agent: if region exists, see commercials in same region; otherwise fallback to own identifiers.
  if (!userRegion) {
    return ownIdentifiers;
  }

  const rows = await sequelize.query(`
    SELECT
      u.USER_ID,
      u.USER_NAME,
      u.REAL_NAME,
      u.GUID
    FROM UCS_USERS u
    INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
    INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
    WHERE (LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale') OR u.USER_ID = :uId)
      AND EXISTS (
        SELECT 1
        FROM tiersGouvernorat tgReq
        INNER JOIN tiersGouvernorat tgUser ON tgUser.id = tgReq.id
        WHERE (
          tgReq.id = TRY_CONVERT(INT, :userRegion)
          OR LOWER(LTRIM(RTRIM(tgReq.libelle))) = LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), :userRegion))))
        )
        AND (
          tgUser.id = TRY_CONVERT(INT, u.Gouvernorat)
          OR LOWER(LTRIM(RTRIM(tgUser.libelle))) = LOWER(LTRIM(RTRIM(CONVERT(NVARCHAR(100), u.Gouvernorat))))
        )
      )
  `, {
    replacements: { userRegion: String(userRegion).trim(), uId: user.UserID },
    type: QueryTypes.SELECT
  });

  const representativeValues = rows.flatMap((row) => [row.USER_ID, row.USER_NAME, row.REAL_NAME, row.GUID]);
  const normalizedValues = representativeValues
    .map((value) => (value === null || value === undefined ? null : String(value).trim().toLowerCase()))
    .filter(Boolean);

  return Array.from(new Set([...ownIdentifiers, ...normalizedValues]));
};

const buildModuleScopeFilter = async (moduleCode, user = {}) => {
  const normalizedRole = normalizeRole(user?.UserRole);
  if (normalizedRole === 'admin') return {};
  if (!['commercial', 'agent'].includes(normalizedRole)) return {};

  const filtreRepresEnabled = await getFiltreRepresEnabled(moduleCode, normalizedRole);
  if (!filtreRepresEnabled) {
    return {};
  }

  const representatives = await getRepresentativeScope(user, normalizedRole);
  console.log(`🔍 [filterHelper] buildModuleScopeFilter representatives for ${normalizedRole}:`, representatives);
  if (!representatives.length) {
    console.log(`   - No representatives found, returning empty result`);
    return { [Op.and]: [sequelize.literal('1 = 0')] };
  }

  const moduleKey = String(moduleCode);

  // Clients (TabTiers)
  if (moduleKey === '11' || moduleKey === '30') {
    return {
      [Op.or]: representatives.map((rep) =>
        sequelize.where(sequelize.fn('LOWER', sequelize.col('codRepresTiers')), rep)
      )
    };
  }

  // Devis (TabDevm)
  if (moduleKey === '4') {
    return {
      [Op.or]: representatives.map((rep) =>
        sequelize.where(sequelize.fn('LOWER', sequelize.col('CodRepres')), rep)
      )
    };
  }

  // Activites (TabActivite): scope through client portfolio (CodTiers assigned to same commercial scope)
  if (moduleKey === '45') {
    const allowedTiers = await sequelize.query(`
      SELECT CodTiers
      FROM TabTiers
      WHERE LOWER(codRepresTiers) IN (:representatives)
    `, {
      replacements: { representatives },
      type: QueryTypes.SELECT
    });

    const codTiersList = Array.from(new Set(
      allowedTiers.map((row) => row.CodTiers).filter(Boolean)
    ));

    if (!codTiersList.length) {
      return { CodTiers: '__NO_SCOPE__' };
    }

    return { CodTiers: { [Op.in]: codTiersList } };
  }

  return {};
};

/**
 * ═══════════════════════════════════════════════════════════════════════
 * FILTER HELPER - Universal filtering gateway for all modules
 * ═══════════════════════════════════════════════════════════════════════
 * Gère les filtres basés sur la table TabRoleFilterVisibility
 */

/**
 * Apply table-driven filters with pagination
 * @param {string} moduleCode - Code du module (ex: '2' for Tiers, '12' for Users)
 * @param {object} queryParams - Query parameters { field_name: value, page: 1, limit: 20 }
 * @param {object} user - User object with UserID and role
 * @returns {object} { where: {}, limit, offset, page, filters: [] }
 */
exports.applyTableDrivenFiltersWithPagination = async (moduleCode, queryParams, user) => {
  try {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const offset = (page - 1) * limit;

    // Construire les conditions WHERE basées sur les paramètres
    const where = {};

    // Appliquer chaque filtre disponible (sauf page/limit)
    for (const [key, value] of Object.entries(queryParams)) {
      if (isFilterableField(key) && value !== undefined && value !== null && value !== '') {
        where[key] = {
          [Op.like]: `%${value}%`
        };
      }
    }

    const scopedWhere = await buildModuleScopeFilter(moduleCode, user);

    let finalWhere = where;
    if (hasWhereConditions(where) && hasWhereConditions(scopedWhere)) {
      finalWhere = { [Op.and]: [where, scopedWhere] };
    } else if (hasWhereConditions(scopedWhere)) {
      finalWhere = scopedWhere;
    }

    return {
      where: finalWhere,
      limit,
      offset,
      page,
      filters: Object.keys(where)
    };
  } catch (error) {
    console.error('❌ Error in applyTableDrivenFiltersWithPagination:', error.message);
    throw error;
  }
};

/**
 * Apply filters without pagination
 * @param {string} moduleCode - Code du module
 * @param {object} queryParams - Query parameters
 * @param {object} user - User object
 * @returns {object} { where: {} }
 */
exports.applyTableDrivenFilters = async (moduleCode, queryParams, user) => {
  const { where } = await exports.applyTableDrivenFiltersWithPagination(
    moduleCode,
    queryParams,
    user
  );
  return where;
};

/**
 * Format paginated response
 * @param {array} rows - Data rows
 * @param {number} count - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} { data, pagination: { total, page, limit, pages } }
 */
exports.formatPaginatedResponse = (rows, count, page, limit) => {
  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1
    }
  };
};

/**
 * Get role-based visibility filters
 * @param {string} moduleCode - Code du module
 * @param {string} roleID - ID du rôle
 * @returns {object} Visibility configuration
 */
exports.getRoleVisibilityFilters = async (moduleCode, roleID) => {
  try {
    const filters = await TabRoleFilterVisibility.findAll({
      where: {
        ModuleCode: moduleCode,
        RoleID: roleID
      }
    });

    return filters;
  } catch (error) {
    console.error('❌ Error fetching role visibility filters:', error.message);
    return [];
  }
};

/**
 * Apply role-based column visibility
 * @param {array} rows - Data rows
 * @param {array} visibilityFilters - Visibility configuration
 * @returns {array} Filtered rows with only visible columns
 */
exports.applyColumnVisibility = (rows, visibilityFilters) => {
  if (!visibilityFilters || visibilityFilters.length === 0) {
    return rows;
  }

  const visibleFields = visibilityFilters.map(f => f.FieldName);

  return rows.map(row => {
    const filteredRow = {};
    visibleFields.forEach(field => {
      if (field in row) {
        filteredRow[field] = row[field];
      }
    });
    return filteredRow;
  });
};

module.exports = exports;
