/**
 * filterHelper.js
 * Helper réutilisable pour appliquer les filtres table-driven à n'importe quel contrôleur
 * Remplace tous les if/else hard-codés par une approche data-driven
 */

const filterConfigService = require('../services/filterConfigService');
const buildWhereClauseService = require('../services/buildWhereClauseService');
const filterService = require('../services/filterService');

/**
 * ✅ APPLIQUER LES FILTRES TABLE-DRIVEN À UNE REQUÊTE
 * 
 * @param {string} moduleCode - Code du module (31, 5, 6, 3, 12, 19, 11, 46, 45, 28, 47)
 * @param {Object} queryParams - Paramètres de la requête (req.query)
 * @param {Object} userData - Données de l'utilisateur (req.user)
 * @returns {Object} WHERE clause prête pour Sequelize
 * 
 * EXEMPLE D'UTILISATION:
 * const where = await applyTableDrivenFilters('31', req.query, req.user);
 * const devis = await DevisMaster.findAll({ where });
 */
const applyTableDrivenFilters = async (moduleCode, queryParams, userData) => {
    try {
        console.log(`🔍 applyTableDrivenFilters: Applying filters for module=${moduleCode}`);
        const { normalizeRole } = require('./userAccess');
        
        // Sécurisation de l'accès à userData
        const user = userData || {};
        const roleName = normalizeRole(user.UserRole || 'all');
        
        const filterConfigs = await filterConfigService.getFilterConfigByModule(moduleCode, roleName);

        if (!filterConfigs || filterConfigs.length === 0) {
            console.warn(`⚠️ No filter configs found for module ${moduleCode} and role ${roleName}`);
            return {};
        }

        console.log(`✅ Loaded ${filterConfigs.length} filter configs`);

        const normalizedFilters = buildWhereClauseService.normalizeFrontendFilters(
            queryParams,
            filterConfigs
        );

        const whereClause = await buildWhereClauseService.buildWhereClause(
            normalizedFilters,
            user
        );

        return whereClause;

    } catch (error) {
        console.error(`❌ Error applying table-driven filters for module ${moduleCode}:`, error);
        return {}; 
    }
};

const applyTableDrivenFiltersWithPagination = async (moduleCode, queryParams = {}, userData = {}) => {
    try {
        const page = parseInt(queryParams.page) || 1;
        let limit = parseInt(queryParams.limit) || 20;

        // ✅ SÉCURITÉ : Cap le limit maximum pour éviter de faire ramer SQL Server
        // Le timeout de 15s arrive souvent à limit=1000 sans index.
        if (limit > 100) {
            console.log(`⚠️  Limit ${limit} too high, capping at 100 for safety.`);
            limit = 100;
        }

        const offset = (page - 1) * limit;


        const where = await applyTableDrivenFilters(moduleCode, queryParams, userData);

        return {
            where,
            limit,
            offset,
            page,
            pageSize: limit
        };

    } catch (error) {
        console.error(`❌ Error in applyTableDrivenFiltersWithPagination for module ${moduleCode}:`, error);
        return {
            where: {},
            limit: 100,
            offset: 0,
            page: 1,
            pageSize: 100
        };
    }
};



/**
 * ✅ FORMAT LA RÉPONSE AVEC PAGINATION
 * Utiliser après findAndCountAll pour formater les résultats
 */
const formatPaginatedResponse = (data, count, page, limit, extra = {}) => {
    return {
        status: 'success',
        pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        },
        ...extra,
        data: data
    };
};

/**
 * ✅ VERSION COURTE POUR CAS SIMPLES
 * Quand vous avez juste besoin de la WHERE clause
 */
const getWhereClause = async (moduleCode, queryParams, userData) => {
    return await applyTableDrivenFilters(moduleCode, queryParams, userData);
};

/**
 * ✅ MAPPER DES MODULES À LEURS CODES
 * Pour éviter les erreurs: devis → 31, etc.
 */
const MODULE_CODES = {
    'devis': 'DEVIS',
    'sav': 'RECLAMATION',
    'fav': 'FAV',
    'blv': 'BLV',
    'bcv': 'BCV',
    'product': 'STOCK',
    'products': 'STOCK',
    'user': '19',
    'users': '19',
    'client': '11',
    'clients': '11',
    'tiers': '11',
    'project': '46',
    'projects': '46',
    'projet': '46',
    'projets': '46',
    'activity': '45',
    'activite': '45',
    'activities': '45',
    'activites': '45',
    'message': '28',
    'messages': '28',
    'messaging': '28',
    'reclamation': 'RECLAMATION',
    'claim': 'RECLAMATION',
    'claims': 'RECLAMATION',
    'support': 'RECLAMATION'
};

const getModuleCode = (moduleName) => {
    return MODULE_CODES[moduleName.toLowerCase()] || null;
};

/**
 * ✅ OBTENIR LA VISIBILITÉ DES FILTRES POUR UN RÔLE ET UN MODULE
 * Retourne un objet formaté pour le frontend { key: { id, label, visible, count } }
 */
const getModuleFiltersVisibility = async (userRole, moduleName, counts = {}) => {
    try {
        const moduleCode = getModuleCode(moduleName);
        if (!moduleCode) return {};

        const allFilters = await filterService.getFilterVisibilityByRoleAndModule(userRole || 'client', moduleCode);

        const result = {};
        allFilters.forEach(filter => {
            result[filter.key] = {
                id: filter.key,
                label: filter.label,
                visible: filter.visible,
                count: counts[filter.key] || 0
            };
        });
        return result;
    } catch (error) {
        console.error(`❌ Error in getModuleFiltersVisibility for ${moduleName}:`, error.message);
        return {};
    }
};

module.exports = {
    applyTableDrivenFilters,
    applyTableDrivenFiltersWithPagination,
    formatPaginatedResponse,
    getWhereClause,
    getModuleFiltersVisibility,
    MODULE_CODES,
    getModuleCode
};
