/**
 * buildWhereClauseService.js
 * Service pour construire les clauses WHERE Sequelize basées sur la configuration des filtres
 * Convertit les valeurs de filtres frontend vers Sequelize WHERE clauses
 */

const { Op } = require('sequelize');

/**
 * ✅ CONSTRUIRE UNE CLAUSE WHERE POUR UN FILTRE
 * @param {Object} filterConfig - Configuration du filtre depuis DB
 * @param {*} filterValue - Valeur entreée par l'utilisateur ({search, status, client, etc})
 * @param {Object} userData - Données utilisateur {userID, CodRepres, Governorat, etc}
 * @returns {Promise<Object>} Clause WHERE format Sequelize
 */
const buildWhereForFilter = async (filterConfig, filterValue, userData = {}) => {
    try {
        // Si filtre non activé, ignorer
        if (!filterConfig.dataFilterEnabled) {
            return {};
        }

        // Si pas de valeur, ignorer
        if (!filterValue && filterValue !== 0 && filterValue !== '') {
            return {};
        }

        const { dataFilterField, dataFilterOperator, dataFilterValue } = filterConfig;

        if (!dataFilterField) {
            console.warn(`⚠️ Filter ${filterConfig.key} has no dataFilterField configured`);
            return {};
        }

        // Remplacer les placeholders
        let processingValue = dataFilterValue;

        if (processingValue && processingValue.includes('{')) {
            // Placeholder patterns:
            // {search} -> user-provided search value
            // {status}, {client}, {commercial}, etc -> user-provided filter values
            // {userId}, {userCodRepres}, {userGovernorate} -> user data from token

            const placeholders = processingValue.match(/\{(\w+)\}/g) || [];
            
            for (const placeholder of placeholders) {
                const key = placeholder.slice(1, -1);  // Remove { }
                let value = null;

                if (key === 'search' || key === 'status' || key === 'client' || 
                    key === 'commercial' || key === 'type' || key === 'priority' ||
                    key === 'amountMin' || key === 'amountMax' || 
                    key === 'dateStart' || key === 'dateEnd' || 
                    key === 'category' || key === 'role' || key === 'region' ||
                    key === 'governorate' || key === 'probability') {
                    // User-provided filter value
                    value = filterValue;
                } else if (key === 'userId') {
                    value = userData.userId || userData.id || userData.UserID;
                } else if (key === 'userCodRepres') {
                    value = userData.CodRepres;
                } else if (key === 'userGovernorat' || key === 'userGouvernorat' || key === 'userGouvernoratName') {
                    // UCS_USERS.Gouvernorat usually contains the NAME or ID as string
                    value = userData.Gouvernorat || userData.Governorate;
                } else if (key === 'userGouvernoratId') {
                    // If we have an ID specifically
                    value = userData.GouvernoratId || userData.Gouvernorat;
                } else if (key === 'userCodSoc') {
                    value = userData.CodSoc;
                } else if (key === 'userEmail') {
                    value = userData.EmailPro || userData.Email;
                }

                if (value !== null && value !== undefined && value !== '') {
                    processingValue = processingValue.replace(placeholder, value);
                } else {
                    // If placeholder cannot be resolved, we might want to skip the filter 
                    // or use a value that returns nothing to be safe
                    processingValue = processingValue.replace(placeholder, '__NULL__');
                }
            }
        }

        // Construire la clause WHERE basée sur l'opérateur
        return buildWhereByOperator(dataFilterField, dataFilterOperator, processingValue);

    } catch (error) {
        console.error(`❌ Error building WHERE clause for filter ${filterConfig.key}:`, error.message);
        return {};
    }
};

/**
 * ✅ CONSTRUIRE LES CLAUSES WHERE MULTIPLES
 * Combine plusieurs filtres avec AND/OR logic
 * @param {Array} filters - Array de filtres appliqués
 * @param {Object} userData - Données utilisateur
 * @returns {Promise<Object>} Clause WHERE consolidée
 */
const buildWhereClause = async (filters = [], userData = {}) => {
    try {
        // --- BYPASS ADMIN ---
        // Si l'utilisateur est Admin, il n'a aucune restriction de données imposée
        const role = (userData.UserRole || '').toLowerCase();
        if (role === 'admin' || role === 'administrateur') {
            console.log('🛡️ Admin Bypass: No WHERE clause applied by table-driven system');
            return {};
        }

        const whereConditions = [];
        const orConditions = [];

        for (const filter of filters) {
            const where = await buildWhereForFilter(filter.config, filter.value, userData);
            
            if (where && Object.keys(where).length > 0) {
                if (filter.config.dataFilterLogic && filter.config.dataFilterLogic.toUpperCase() === 'OR') {
                    orConditions.push(where);
                } else {
                    whereConditions.push(where);
                }
            }
        }

        // Combiner AND conditions
        let result = {};
        whereConditions.forEach(cond => {
            // Sequelize handles multiple properties in an object as AND
            // For complex overlapping fields, we use Op.and
            result = { ...result, ...cond };
        });

        // Ajouter OR conditions si présentes
        if (orConditions.length > 0) {
            result[Op.or] = orConditions;
        }

        return result;

    } catch (error) {
        console.error(`❌ Error building WHERE clause:`, error.message);
        return {};
    }
};

/**
 * ✅ CONSTRUIRE WHERE BASÉ SUR L'OPÉRATEUR
 * @param {string} field - Nom de la colonne DB
 * @param {string} operator - Opérateur (equals, contains, gte, lte, between, in, etc.)
 * @param {*} value - Valeur à filtrer
 * @returns {Object} Clause WHERE Sequelize
 */
const buildWhereByOperator = (field, operator, value) => {
    if (!field || (value === null || value === undefined || value === '')) {
        return {};
    }

    const op = (operator || '').toLowerCase();

    // Support simple field or complex fields (with Subqueries if value starts with SELECT)
    if (typeof value === 'string' && value.toUpperCase().startsWith('(SELECT')) {
        return sequelize.where(sequelize.col(field), { [Op.in]: sequelize.literal(value) });
    }

    switch (op) {
        case 'equals':
        case 'eq':
            return { [field]: value };

        case 'contains':
        case 'like':
            return { [field]: { [Op.like]: `%${value}%` } };

        case 'startswidth':
            return { [field]: { [Op.like]: `${value}%` } };

        case 'endswith':
            return { [field]: { [Op.like]: `%${value}` } };

        case 'gte':
        case 'gte_equal':
            return { [field]: { [Op.gte]: value } };

        case 'lte':
        case 'lte_equal':
            return { [field]: { [Op.lte]: value } };

        case 'gt':
            return { [field]: { [Op.gt]: value } };

        case 'lt':
            return { [field]: { [Op.lt]: value } };

        case 'between':
            if (typeof value === 'string' && value.includes(',')) {
                const [min, max] = value.split(',');
                return { [field]: { [Op.between]: [min, max] } };
            }
            return { [field]: { [Op.between]: value } };

        case 'in':
            if (typeof value === 'string' && value.includes(',')) {
                const vals = value.split(',').map(v => v.trim());
                return { [field]: { [Op.in]: vals } };
            }
            return { [field]: { [Op.in]: Array.isArray(value) ? value : [value] } };

        case 'notin':
        case 'not_in':
            if (typeof value === 'string' && value.includes(',')) {
                const vals = value.split(',').map(v => v.trim());
                return { [field]: { [Op.notIn]: vals } };
            }
            return { [field]: { [Op.notIn]: Array.isArray(value) ? value : [value] } };

        case 'isnull':
            return { [field]: null };

        case 'isnotnull':
            return { [field]: { [Op.not]: null } };

        default:
            return { [field]: value };
    }
};

/**
 * ✅ CONVERTIR FILTRES FRONTEND VERS FORMAT SERVICE
 * @param {Object} frontendFilters - Objet {search: 'X', status: 'Y', client: 'Z'}
 * @param {Array} filterConfigs - Array de configs depuis DB
 * @returns {Array} Format [{ config, value }, ...]
 */
const normalizeFrontendFilters = (frontendFilters = {}, filterConfigs = []) => {
    // On prend TOUS les filtres activés pour ce module/rôle
    return filterConfigs
        .filter(fc => fc.dataFilterEnabled === 1 || fc.dataFilterEnabled === true)
        .map(fc => {
            // 1. Priorité à la valeur envoyée par le frontend
            let value = frontendFilters[fc.key];
            
            // 2. Sinon, utiliser la valeur statique ou placeholder définie en base
            if (value === undefined || value === null || value === '') {
                value = fc.dataFilterValue;
            }

            return {
                config: fc,
                value: value
            };
        })
        // On ne garde que ceux qui ont une valeur (statique ou fournie)
        .filter(f => f.value !== null && f.value !== undefined && f.value !== '');
};


/**
 * ✅ TESTER LES OPÉRATEURS
 * Validation des opérateurs supportés
 */
const SUPPORTED_OPERATORS = [
    'equals', 'contains', 'startswidth', 'endswith',
    'gte', 'lte', 'gt', 'lt', 'between',
    'in', 'notin', 'isnull', 'isnotnull', 'matches_user'
];

const isSupportedOperator = (operator) => {
    return SUPPORTED_OPERATORS.includes((operator || '').toLowerCase());
};

module.exports = {
    buildWhereForFilter,
    buildWhereClause,
    buildWhereByOperator,
    normalizeFrontendFilters,
    isSupportedOperator,
    SUPPORTED_OPERATORS
};
