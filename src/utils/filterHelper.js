const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
// Import models lazily inside functions if needed, or at the top if no circular dep
const getModels = () => require('../models');

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
  'status',
  'selectedCommercial',
  'includeAll',
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
  const userId = user?.UserID || user?.id || user?.USER_ID;

  // For Commercial: find their client portfolio from TabTiers (codRepresTiers = USER_ID)
  if (normalizedRole === 'commercial') {
    if (!userId) {
      console.log(`🔍 [filterHelper] No USER_ID found for commercial, returning own identifiers`);
      return ownIdentifiers;
    }
    
    // Convert userId to varchar string since codRepresTiers is a varchar column with mixed data
    const userIdStr = String(userId);
    
    const clientRows = await sequelize.query(`
      SELECT CodTiers
      FROM TabTiers
      WHERE CONVERT(VARCHAR, codRepresTiers) = :userIdStr
    `, {
      replacements: { userIdStr },
      type: QueryTypes.SELECT
    });
    
    const clientCodes = clientRows.map(row => row.CodTiers).filter(Boolean);
    console.log(`🔍 [filterHelper] Commercial ${userId} clients:`, clientCodes);
    
    if (clientCodes.length > 0) {
      return clientCodes;  // Return client codes for filtering
    }
    return ownIdentifiers;  // Fallback to own identifiers
  }

  if (normalizedRole !== 'agent') {
    return ownIdentifiers;
  }

  // Agent: if region exists, see commercials in same region and their clients; otherwise fallback to own identifiers.
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
    replacements: { userRegion: String(userRegion).trim(), uId: userId },
    type: QueryTypes.SELECT
  });

  // Get client portfolios for all these commercials
  const commercialIds = rows.map(row => row.USER_ID).filter(Boolean);
  if (commercialIds.length > 0) {
    // Convert commercial IDs to strings since codRepresTiers is a varchar column with mixed data
    const commercialIdStrings = commercialIds.map(id => String(id));
    
    const clientRows = await sequelize.query(`
      SELECT CodTiers
      FROM TabTiers
      WHERE CONVERT(VARCHAR, codRepresTiers) IN (:commercialIdStrings)
    `, {
      replacements: { commercialIdStrings },
      type: QueryTypes.SELECT
    });
    
    const clientCodes = clientRows.map(row => row.CodTiers).filter(Boolean);
    console.log(`🔍 [filterHelper] Agent region commercials clients:`, clientCodes);
    
    if (clientCodes.length > 0) {
      return Array.from(new Set(clientCodes));
    }
  }

  return ownIdentifiers;
};

const buildModuleScopeFilter = async (moduleCode, user = {}, query = {}) => {
  const normalizedRole = normalizeRole(user?.UserRole);
  const selectedCommercialId = query.selectedCommercial;

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN role: usually sees everything, but can filter by a selected commercial
  // ═══════════════════════════════════════════════════════════════════════════
  if (normalizedRole === 'admin') {
    const includeAll = query.includeAll === 'true' || query.includeAll === true || query.includeAll === '1';
    
    // Determine the target commercial ID based on selectedCommercial or default to 'mine'
    let targetId = null;
    let isAll = false;

    if (selectedCommercialId === 'all' || includeAll) {
      isAll = true;
    } else if (selectedCommercialId === 'mine' || !selectedCommercialId) {
      targetId = user?.UserID || user?.id || user?.USER_ID;
      console.log(`🔍 [filterHelper] Admin viewing OWN records (Resolved ID: ${targetId})`);
    } else {
      targetId = selectedCommercialId;
      console.log(`🔍 [filterHelper] Admin filtering by SPECIFIC commercial: ${targetId}`);
    }

    const moduleKey = String(moduleCode);
    const hasCodRepres = ['4', '5', '6', '7'].includes(moduleKey);
    const isTiersModule = moduleKey === '11' || moduleKey === '30';

    if (isAll || !targetId) {
      console.log('🔍 [filterHelper] Admin requested ALL records (or no target ID found)');
      return {};
    }

    // Ensure targetId is not the literal string 'mine' if it somehow passed through
    const resolvedTargetId = String(targetId) === 'mine' ? (user?.UserID || user?.id || user?.USER_ID) : targetId;

    // Get the client portfolio for this specific commercial
    const clientRows = await sequelize.query(`
      SELECT CodTiers
      FROM TabTiers
      WHERE CONVERT(VARCHAR, codRepresTiers) = :targetId
    `, {
      replacements: { targetId: String(resolvedTargetId) },
      type: QueryTypes.SELECT
    });

    const clientCodes = clientRows.map(row => row.CodTiers).filter(Boolean);
    
    const conditions = [];
    
    if (isTiersModule) {
      conditions.push({ codRepresTiers: String(resolvedTargetId) });
    } else if (hasCodRepres) {
      conditions.push({ CodRepres: String(resolvedTargetId) });
    }
    
    const isCodTiersModule = isTiersModule || hasCodRepres || ['31', '51'].includes(moduleKey);

    if (clientCodes.length > 0 && isCodTiersModule) {
      conditions.push({ CodTiers: { [Op.in]: clientCodes } });
    }

    if (conditions.length === 0) {
      console.log(`🔍 [filterHelper] No specific column-based filter for module ${moduleKey}, and no specific restrictions found.`);
      return {}; 
    }

    return conditions.length === 1 ? conditions[0] : { [Op.or]: conditions };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENT role: always filter — show only their own data (no FiltreRepres needed)
  // ═══════════════════════════════════════════════════════════════════════════
  if (normalizedRole === 'client') {
    const directCodTiers = user?.CodTiers || user?.codTiers || null;
    if (directCodTiers) {
      return { CodTiers: directCodTiers };
    }

    const userEmail = user?.EmailPro || user?.LoginName || user?.email;
    if (!userEmail) return { [Op.and]: [sequelize.literal('1 = 0')] };

    // Find the client's CodTiers by matching email as fallback
    const clientRow = await sequelize.query(`
      SELECT TOP 1 CodTiers FROM TabTiers WHERE LOWER(LTRIM(RTRIM(COALESCE(Email, '')))) = LOWER(LTRIM(RTRIM(:email)))
    `, { replacements: { email: userEmail }, type: QueryTypes.SELECT });

    const codTiers = clientRow[0]?.CodTiers;
    if (!codTiers) return { [Op.and]: [sequelize.literal('1 = 0')] };

    const moduleKey = String(moduleCode);
    // Devis, BCV, BLV, Factures → filter by CodTiers
    if (['4', '5', '6', '7'].includes(moduleKey)) {
      return { CodTiers: codTiers };
    }
    // Tiers → show only own record
    if (moduleKey === '11' || moduleKey === '30') {
      return { CodTiers: codTiers };
    }
    // Reclamations/SAV → filter by CodTiers
    if (moduleKey === '31' || moduleKey === '51') {
      return { CodTiers: codTiers };
    }
    return { CodTiers: codTiers };
  }

  const moduleKey = String(moduleCode);

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 11 (Clients/Tiers) - Filter by codRepresTiers to show assigned clients
  // Show clients assigned to representatives in same region/role
  // ═══════════════════════════════════════════════════════════════════════════
  if (moduleKey === '11' || moduleKey === '30') {
    const userRegion = user?.Gouvernorat ?? user?.gouvernorat ?? null;
    const userId = user?.UserID || user?.id || user?.USER_ID;

    if (normalizedRole === 'commercial') {
      if (!userId) {
        console.log(`🔍 [filterHelper] Module ${moduleKey}: No USER_ID for commercial, no filter`);
        return { [Op.and]: [sequelize.literal('1 = 0')] };
      }

      const userIdStr = String(userId);
      console.log(`   🔍 [filterHelper] Module ${moduleKey} (Tiers): Commercial ${userId} - always filtering by codRepresTiers`);
      return {
        codRepresTiers: userIdStr
      };
    }

    if (!['commercial', 'agent'].includes(normalizedRole)) return {};

    const filtreRepresEnabled = await getFiltreRepresEnabled(moduleCode, normalizedRole);
    if (!filtreRepresEnabled) {
      return {};
    }

    // For Agent: get commercials in same region
    if (normalizedRole === 'agent') {
      if (!userRegion) {
        console.log(`🔍 [filterHelper] Module ${moduleKey}: Agent has no region, no filter`);
        return {};
      }

      const commercials = await sequelize.query(`
        SELECT u.USER_ID
        FROM UCS_USERS u
        INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
        INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
        WHERE LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale')
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
        replacements: { userRegion: String(userRegion).trim() },
        type: QueryTypes.SELECT
      });

      const commercialIds = commercials.map(row => row.USER_ID).filter(Boolean);
      console.log(`   🔍 [filterHelper] Module ${moduleKey} (Tiers): Agent region ${userRegion} - ${commercialIds.length} commercials found`);

      if (commercialIds.length === 0) {
        console.log(`   🔍 [filterHelper] Module ${moduleKey}: No commercials in region, blocking all`);
        return { [Op.and]: [sequelize.literal('1 = 0')] };
      }

      // VARCHAR column — use strings only to avoid implicit int conversion on 'Admin' etc.
      const commercialIdStrings = commercialIds.map(id => String(id));
      console.log(`   🔍 [filterHelper] Module ${moduleKey}: Filtering by ${commercialIdStrings.length} commercial IDs:`, commercialIdStrings);
      return {
        codRepresTiers: { [Op.in]: commercialIdStrings }
      };
    }

    return {};
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // For other modules, get representative scope (commercial/agent)
  // ═══════════════════════════════════════════════════════════════════════════
  const representatives = await getRepresentativeScope(user, normalizedRole);
  console.log(`🔍 [filterHelper] buildModuleScopeFilter representatives for ${normalizedRole}:`, representatives);
  if (!representatives.length) {
    console.log(`   - No representatives found, returning empty result`);
    return { [Op.and]: [sequelize.literal('1 = 0')] };
  }

  // Devis/BCV/BLV/FAV: scope through client portfolio
  // Note: getRepresentativeScope already returns the list of CodTiers appropriate for this user/role
  // For Commercial: returns their client codes
  // For Agent: returns their region commercials' client codes
  if (['4', '5', '6', '7'].includes(moduleKey)) {
    // Representatives are already the CodTiers we need - use them directly
    if (representatives.length === 0) {
      console.log(`   🔍 [filterHelper] Module ${moduleKey}: No client codes found, blocking all access`);
      return { [Op.and]: [sequelize.literal('1 = 0')] };
    }

    console.log(`   🔍 [filterHelper] Module ${moduleKey}: Filtering by ${representatives.length} client codes:`, representatives);
    const filterResult = { CodTiers: { [Op.in]: representatives } };
    console.log(`   🔍 [filterHelper] Module ${moduleKey} filter object keys:`, Object.keys(filterResult));
    console.log(`   🔍 [filterHelper] Module ${moduleKey} filter object symbols:`, Object.getOwnPropertySymbols(filterResult['CodTiers']));
    return filterResult;
  }

  // Activites (TabActivite): scope through user assignment (User column)
  if (moduleKey === '45' || moduleKey === '8') {
    if (normalizedRole === 'admin') {
      if (selectedCommercialId) {
        return { User: Number(selectedCommercialId) };
      }
      return {};
    }

    const filtreRepresEnabled = await getFiltreRepresEnabled(moduleCode, normalizedRole);
    if (!filtreRepresEnabled) {
      console.log(`   🔍 [filterHelper] Module ${moduleKey}: FiltreRepres disabled, showing all`);
      return {};
    }

    if (normalizedRole === 'commercial') {
      const userId = user?.UserID || user?.id || user?.USER_ID;
      if (!userId) return { [Op.and]: [sequelize.literal('1 = 0')] };
      return { User: Number(userId) };
    }

    if (normalizedRole === 'agent') {
      const userRegion = user?.Gouvernorat ?? user?.gouvernorat ?? null;
      if (!userRegion) return { [Op.and]: [sequelize.literal('1 = 0')] };

      const commercials = await sequelize.query(`
        SELECT u.USER_ID
        FROM UCS_USERS u
        INNER JOIN UCS_USERINFO ui ON ui.USER_ID = u.USER_ID AND ui.APP_ID = 1
        INNER JOIN UCS_PROFILES p ON p.PROF_ID = ui.PROF_ID
        WHERE LOWER(p.PROF_DESCRIPTION) IN ('commercial', 'commerciale')
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
        replacements: { userRegion: String(userRegion).trim() },
        type: QueryTypes.SELECT
      });

      const commercialIds = commercials.map(row => row.USER_ID).filter(Boolean);
      const agentId = user?.UserID || user?.id || user?.USER_ID;
      if (agentId) commercialIds.push(agentId); // Agent can see their own activities too

      if (commercialIds.length === 0) {
        return { [Op.and]: [sequelize.literal('1 = 0')] };
      }

      console.log(`   🔍 [filterHelper] Module ${moduleKey}: Agent filtering by User IDs:`, commercialIds);
      return { User: { [Op.in]: commercialIds.map(id => Number(id)) } };
    }

    // Fallback for client roles or unexpected roles
    if (representatives.length === 0) {
      return { [Op.and]: [sequelize.literal('1 = 0')] };
    }
    return { CodTiers: { [Op.in]: representatives } };
  }

  // Reclamations/SAV
  if (moduleKey === '31' || moduleKey === '51') {
    if (normalizedRole === 'admin') return {};

    const filtreRepresEnabled = await getFiltreRepresEnabled(moduleCode, normalizedRole);
    if (!filtreRepresEnabled) {
      console.log(`   🔍 [filterHelper] Module ${moduleKey}: FiltreRepres disabled, showing all`);
      return {};
    }

    if (representatives.length === 0) {
      console.log(`   🔍 [filterHelper] Module ${moduleKey}: FiltreRepres enabled but no client codes found, blocking all access`);
      return { [Op.and]: [sequelize.literal('1 = 0')] };
    }

    console.log(`   🔍 [filterHelper] Module ${moduleKey}: Filtering by ${representatives.length} client codes`);
    return { CodTiers: { [Op.in]: representatives } };
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

    const scopedWhere = await buildModuleScopeFilter(moduleCode, user, queryParams);
    console.log(`   📋 [filterHelper] buildModuleScopeFilter returned:`, scopedWhere);
    console.log(`   📋 [filterHelper] hasWhereConditions(scopedWhere):`, hasWhereConditions(scopedWhere));

    let finalWhere = where;
    if (hasWhereConditions(where) && hasWhereConditions(scopedWhere)) {
      finalWhere = { [Op.and]: [where, scopedWhere] };
    } else if (hasWhereConditions(scopedWhere)) {
      finalWhere = scopedWhere;
    }

    console.log(`   📋 [filterHelper] Final where object:`, JSON.stringify(finalWhere, (key, value) => 
      typeof value === 'symbol' ? value.toString() : value
    , 2));

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
    const { TabRoleFilterVisibility } = getModels();
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
