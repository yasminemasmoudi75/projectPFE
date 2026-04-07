/**
 * filterConfigService.js
 * Service pour charger et gérer la configuration des filtres depuis la BD
 * Utilise les nouvelles colonnes: FilterDisplayType, DataFilterEnabled, DataFilterField, etc.
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * ✅ CHARGER TOUS LES FILTRES D'UN MODULE AVEC CONFIGURATION COMPLÈTE
 * @param {string} moduleCode - Code du module (31, 5, 6, 3, 12, etc.)
 * @param {string} roleName - Nom du rôle de l'utilisateur (admin, agent, commercial, client, etc.)
 * @returns {Promise<Array>} Tous les filtres configurés pour le module
 */
const getFilterConfigByModule = async (moduleCode, roleName = 'all') => {
    try {
        console.log(`📋 filterConfigService: Loading filters for module="${moduleCode}" and role="${roleName}"`);

        const query = `
            SELECT 
                [Id], [ModuleCode], [FilterKey], [FilterLabel], [VisibleForRole], [ProfileUser],
                [FilterDisplayType], [FilterPlaceholder], [FilterHelpText], [SortOrder],
                [DataFilterEnabled], [DataFilterField], [DataFilterOperator], [DataFilterValue], [DataFilterLogic],
                [FilterDataSource], [FilterOptions], [FilterDependsOn], [CreatedAt], [UpdatedAtTimestamp]
            FROM [dbo].[TabRoleFilterVisibility]
            WHERE UPPER([ModuleCode]) = UPPER(:moduleCode)
              AND (
                  UPPER([ProfileUser]) = UPPER(:roleName) 
                  OR UPPER([ProfileUser]) = 'ALL' 
                  OR [ProfileUser] IS NULL
              )
            ORDER BY [SortOrder] ASC, [FilterKey] ASC
        `;

        const filters = await sequelize.query(query, {
            replacements: { 
                moduleCode, 
                roleName: roleName || 'all' 
            },
            type: QueryTypes.SELECT
        });


        console.log(`✅ Loaded ${filters.length} filters for module ${moduleCode}`);

        // Mapper les données vers format frontend-friendly
        return filters.map(mapFilterConfig);

    } catch (error) {
        console.error(`❌ Error loading filters for module ${moduleCode}:`, error.message);
        return [];
    }
};

/**
 * ✅ CHARGER UN FILTER SPÉCIFIQUE
 * @param {string} moduleCode - Code du module
 * @param {string} filterKey - Clé du filtre
 * @returns {Promise<Object>} Configuration du filtre
 */
const getFilterConfig = async (moduleCode, filterKey) => {
    try {
        const query = `
            SELECT * FROM [dbo].[TabRoleFilterVisibility]
            WHERE UPPER([ModuleCode]) = UPPER(:moduleCode)
              AND UPPER([FilterKey]) = UPPER(:filterKey)
        `;

        const result = await sequelize.query(query, {
            replacements: { moduleCode, filterKey },
            type: QueryTypes.SELECT
        });

        if (result.length > 0) {
            return mapFilterConfig(result[0]);
        }
        return null;

    } catch (error) {
        console.error(`❌ Error loading filter config:`, error.message);
        return null;
    }
};

/**
 * ✅ OBTENIR LES FILTRES EN CASCADE
 * Pour un filtre X qui dépend d'un filtre Y (FilterDependsOn), trouver Y
 * @param {string} moduleCode - Code du module
 * @param {string} filterKey - Clé du filtre qui dépend d'un autre
 * @returns {Promise<Object>} Config du filtre dont dépend filterKey
 */
const getCascadeParent = async (moduleCode, filterKey) => {
    try {
        const query = `
            SELECT 
                [FilterDependsOn],
                [FilterKey]
            FROM [dbo].[TabRoleFilterVisibility]
            WHERE UPPER([ModuleCode]) = UPPER(:moduleCode)
              AND UPPER([FilterKey]) = UPPER(:filterKey)
        `;

        const result = await sequelize.query(query, {
            replacements: { moduleCode, filterKey },
            type: QueryTypes.SELECT
        });

        if (result.length > 0 && result[0].FilterDependsOn) {
            // Récupérer le parent
            return await getFilterConfig(moduleCode, result[0].FilterDependsOn);
        }
        return null;

    } catch (error) {
        console.error(`❌ Error loading cascade parent:`, error.message);
        return null;
    }
};

/**
 * ✅ MAPPER LA CONFIGURATION D'UN FILTRE
 * Convertir depuis format DB vers format frontend
 * @param {Object} dbRow - Rangée de la BD
 * @returns {Object} Configuration format frontend
 */
const mapFilterConfig = (dbRow) => {
    return {
        // Core Info
        id: dbRow.Id,
        key: dbRow.FilterKey?.trim()?.toLowerCase() || '',
        label: dbRow.FilterLabel || dbRow.FilterKey,
        moduleCode: dbRow.ModuleCode,

        // Visibility
        visible: dbRow.VisibleForRole === 1 || dbRow.VisibleForRole === true,
        visibleForRole: dbRow.VisibleForRole,

        // UI Display
        displayType: dbRow.FilterDisplayType || 'text',  // text, number, date, select, multi-select
        placeholder: dbRow.FilterPlaceholder || '',
        helpText: dbRow.FilterHelpText || '',
        sortOrder: dbRow.SortOrder || 1000,

        // Server-side Data Filtering
        dataFilterEnabled: dbRow.DataFilterEnabled === 1,
        dataFilterField: dbRow.DataFilterField || '',      // DB column name
        dataFilterOperator: dbRow.DataFilterOperator || '', // equals, contains, gte, lte, between, in
        dataFilterValue: dbRow.DataFilterValue || '',       // {placeholder} or static value
        dataFilterLogic: dbRow.DataFilterLogic || 'AND',    // AND, OR

        // Filter Options & Data Source
        dataSource: dbRow.FilterDataSource || null,         // Clients, Commercials, Statuses, etc.
        options: dbRow.FilterOptions ? JSON.parse(dbRow.FilterOptions) : null,

        // Cascade Support
        dependsOn: dbRow.FilterDependsOn || null,           // Parent filter key

        // Timestamps
        createdAt: dbRow.CreatedAt,
        updatedAt: dbRow.UpdatedAtTimestamp
    };
};

/**
 * ✅ OBTENIR TOUS LES FILTRES AVEC LEURS RELATIONS DE CASCADE
 * @param {string} moduleCode - Code du module
 * @returns {Promise<Object>} Objet { filterKey: filterConfig, ... } avec relations
 */
const getFilterConfigMap = async (moduleCode) => {
    try {
        const filters = await getFilterConfigByModule(moduleCode);
        
        const map = {};
        filters.forEach(filter => {
            map[filter.key] = filter;
        });

        // Enrichir avec les infos de cascade
        for (const key in map) {
            if (map[key].dependsOn) {
                map[key].parentFilter = map[map[key].dependsOn] || null;
            }
        }

        return map;

    } catch (error) {
        console.error(`❌ Error building filter config map:`, error.message);
        return {};
    }
};

/**
 * ✅ VALIDER LA STRUCTURE D'UN FILTRE
 * @param {Object} filterConfig - Configuration du filtre
 * @returns {Boolean} True si valide
 */
const validateFilterConfig = (filterConfig) => {
    return filterConfig &&
        filterConfig.key &&
        filterConfig.displayType &&
        filterConfig.moduleCode;
};

module.exports = {
    getFilterConfigByModule,
    getFilterConfig,
    getCascadeParent,
    getFilterConfigMap,
    mapFilterConfig,
    validateFilterConfig
};
