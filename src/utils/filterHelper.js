const { Op } = require('sequelize');
const { TabRoleFilterVisibility, sequelize } = require('../models');

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
      if (key !== 'page' && key !== 'limit' && value) {
        where[key] = {
          [Op.like]: `%${value}%`
        };
      }
    }

    return {
      where,
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
  return { where };
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
