/**
 * filterConfigService.js
 * Service pour charger et gérer la configuration des filtres
 * Modifié pour utiliser filterDefinitions.js
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { FILTER_DEFINITIONS } = require('../utils/filterDefinitions');

/**
 * ✅ CHARGER TOUS LES FILTRES D'UN MODULE AVEC CONFIGURATION COMPLÈTE
 */
const getFilterConfigByModule = async (moduleCode, roleName = 'all') => {
    try {
        console.log(`📋 filterConfigService: Loading filters for module="${moduleCode}" and role="${roleName}"`);

        // FALLBACK: Utiliser les définitions centralisées
        const isClient = roleName.toLowerCase() === 'client';
        const definitions = FILTER_DEFINITIONS[moduleCode.toUpperCase()] || [];

        return definitions.map(c => ({
            id: 0,
            key: c.key,
            label: c.label,
            moduleCode: moduleCode,
            visible: isClient ? !c.hideForClient : true,
            dataFilterEnabled: true,
            dataFilterField: c.field,
            dataFilterOperator: c.operator,
            dataFilterValue: c.value,
            dataFilterLogic: 'AND',
            displayType: 'text'
        }));

    } catch (error) {
        console.error(`❌ Error loading filters for module ${moduleCode}:`, error.message);
        return [];
    }
};

/**
 * ✅ CHARGER UN FILTER SPÉCIFIQUE
 */
const getFilterConfig = async (moduleCode, filterKey) => {
    const filters = await getFilterConfigByModule(moduleCode);
    return filters.find(f => f.key.toLowerCase() === filterKey.toLowerCase()) || null;
};

module.exports = {
    getFilterConfigByModule,
    getFilterConfig
};
