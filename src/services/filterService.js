/**
 * filterService.js
 * Service générique pour gérer la visibilité des filtres par rôle et module
 * Interroge la table TabRoleFilterVisibility
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * ✅ OBTENIR LES FILTRES VISIBLES POUR UN RÔLE ET UN MODULE
 * @param {string} userRole - Le rôle de l'utilisateur (admin, client, commercial, etc.)
 * @param {string} moduleCode - Le code du module (STOCK, RECLAMATION, DEVIS, etc.)
 * @returns {Promise<Array>} Liste des filtres avec leur configuration
 */
const getFilterVisibilityByRoleAndModule = async (userRole, moduleCode) => {
    try {
        console.log(`🔍 filterService: Querying filters for role="${userRole}", module="${moduleCode}"`);

                const query = `
                        SELECT
                                [FilterKey],
                                [FilterLabel],
                                [VisibleForRole],
                                [FilterValueType]
                        FROM [dbo].[TabRoleFilterVisibility]
                        WHERE LOWER([ProfileUser]) = LOWER(:userRole)
                            AND UPPER([ModuleCode]) = UPPER(:moduleCode)
                        ORDER BY [FilterKey]
                `;

        const filters = await sequelize.query(query, {
            replacements: { userRole, moduleCode },
            type: QueryTypes.SELECT
        });

        console.log(`✅ Found ${filters.length} filters for ${userRole}/${moduleCode}`);

        return filters.map(f => ({
            key: String(f.FilterKey || '').trim().toLowerCase(),
            label: f.FilterLabel || f.FilterKey,
            visible: f.VisibleForRole === 1 || f.VisibleForRole === true,
            valueType: f.FilterValueType || 'enum'
        }));

    } catch (error) {
        console.error(`❌ Error in getFilterVisibilityByRoleAndModule:`, error.message);
        // Retourner un tableau vide plutôt qu'une erreur
        return [];
    }
};

/**
 * ✅ OBTENIR LES FILTRES VISIBLES UNIQUEMENT (VisibleForRole = 1)
 * @param {string} userRole - Le rôle de l'utilisateur
 * @param {string} moduleCode - Le code du module
 * @returns {Promise<Array>} Liste des FILTRES VISIBLES uniquement
 */
const getVisibleFiltersOnly = async (userRole, moduleCode) => {
    const allFilters = await getFilterVisibilityByRoleAndModule(userRole, moduleCode);
    console.log(`📊 All filters for ${userRole}/${moduleCode}:`, JSON.stringify(allFilters, null, 2));
    const visible = allFilters.filter(f => f.visible);
    console.log(`✅ Visible filters only:`, JSON.stringify(visible, null, 2));
    return visible;
};

/**
 * ✅ CONVERTIR LES FILTRES EN OBJET POUR buildFilterMeta
 * @param {Array} filters - Array de filtres from DB
 * @param {Object} counts - Objet avec les comptages {all: 10, ok: 5, ...}
 * @returns {Object} Objet formaté pour la réponse API
 */
const buildFilterMetaFromDB = (filters, counts = {}) => {
    const result = {};

    filters.forEach(filter => {
        const key = filter.key;
        const count = counts[key] || 0;

        result[key] = {
            id: key,
            label: filter.label,
            count: count,
            visible: filter.visible,
            valueType: filter.valueType
        };
    });

    return result;
};

/**
 * ✅ TESTER LA CONNEXION À LA TABLE
 */
const testConnection = async () => {
    try {
        console.log('🧪 Testing TabRoleFilterVisibility table connection...');

        const result = await sequelize.query(`
            SELECT COUNT(*) as TotalRows FROM [dbo].[TabRoleFilterVisibility]
        `, {
            type: QueryTypes.SELECT
        });

        console.log(`✅ Table connection OK! Total rows: ${result[0].TotalRows}`);
        return result[0].TotalRows;

    } catch (error) {
        console.error('❌ Table connection FAILED:', error.message);
        throw error;
    }
};

/**
 * ✅ OBTENIR TOUS LES FILTRES D'UN MODULE (TOUS LES RÔLES)
 */
const getAllFiltersForModule = async (moduleCode) => {
    try {
        const query = `
            SELECT DISTINCT
                [ProfileUser],
                [FilterKey],
                [FilterLabel],
                [VisibleForRole],
                [FilterValueType]
            FROM [dbo].[TabRoleFilterVisibility]
            WHERE UPPER([ModuleCode]) = UPPER(:moduleCode)
            ORDER BY [ProfileUser], [FilterKey]
        `;

        const filters = await sequelize.query(query, {
            replacements: { moduleCode },
            type: QueryTypes.SELECT
        });

        return filters;

    } catch (error) {
        console.error('❌ Error in getAllFiltersForModule:', error.message);
        return [];
    }
};

/**
 * ✅ OBTENIR TOUS LES RÔLES DISPONIBLES
 */
const getAllRoles = async () => {
    try {
        const query = `
            SELECT DISTINCT [ProfileUser]
            FROM [dbo].[TabRoleFilterVisibility]
            ORDER BY [ProfileUser]
        `;

        const roles = await sequelize.query(query, {
            type: QueryTypes.SELECT
        });

        return roles.map(r => r.ProfileUser);

    } catch (error) {
        console.error('❌ Error in getAllRoles:', error.message);
        return [];
    }
};

/**
 * ✅ OBTENIR TOUS LES MODULES DISPONIBLES
 */
const getAllModules = async () => {
    try {
        const query = `
            SELECT DISTINCT [ModuleCode]
            FROM [dbo].[TabRoleFilterVisibility]
            ORDER BY [ModuleCode]
        `;

        const modules = await sequelize.query(query, {
            type: QueryTypes.SELECT
        });

        return modules.map(m => m.ModuleCode);

    } catch (error) {
        console.error('❌ Error in getAllModules:', error.message);
        return [];
    }
};

/**
 * ✅ STATISTIQUES DE LA TABLE
 */
const getTableStats = async () => {
    try {
        const query = `
            SELECT
                COUNT(*) AS TotalRows,
                COUNT(DISTINCT [ProfileUser]) AS TotalRoles,
                COUNT(DISTINCT [ModuleCode]) AS TotalModules,
                COUNT(DISTINCT [FilterKey]) AS TotalFilters,
                SUM(CASE WHEN [VisibleForRole] = 1 THEN 1 ELSE 0 END) AS VisibleCount,
                SUM(CASE WHEN [VisibleForRole] = 0 THEN 1 ELSE 0 END) AS HiddenCount
            FROM [dbo].[TabRoleFilterVisibility]
        `;

        const stats = await sequelize.query(query, {
            type: QueryTypes.SELECT
        });

        return stats[0];

    } catch (error) {
        console.error('❌ Error in getTableStats:', error.message);
        return null;
    }
};

module.exports = {
    getFilterVisibilityByRoleAndModule,
    getVisibleFiltersOnly,
    buildFilterMetaFromDB,
    testConnection,
    getAllFiltersForModule,
    getAllRoles,
    getAllModules,
    getTableStats
};
