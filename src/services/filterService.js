/**
 * filterService.js
 * Service pour gérer la visibilité des filtres par rôle et module
 * Utilise la table TABAWPROFILEACCESS pour la sécurité et filterDefinitions pour les filtres
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { MODULE_MAPPING, FILTER_DEFINITIONS } = require('../utils/filterDefinitions');

/**
 * ✅ OBTENIR LES FILTRES VISIBLES POUR UN RÔLE ET UN MODULE
 */
const getFilterVisibilityByRoleAndModule = async (userRole, moduleCode) => {
    try {
        console.log(`🔍 filterService: Getting filters for role="${userRole}", module="${moduleCode}"`);

        const numericModCode = MODULE_MAPPING[moduleCode.toUpperCase()];

        if (numericModCode) {
            const access = await sequelize.query(`
                SELECT Actif FROM TABAWPROFILEACCESS
                WHERE LOWER(ProfileUser) = LOWER(:userRole) AND CodMod = :modCode
            `, {
                replacements: { userRole, modCode: numericModCode },
                type: QueryTypes.SELECT
            });

            if (access.length > 0 && access[0].Actif === 0) {
                console.log(`🚫 Access denied for module ${moduleCode} for role ${userRole}`);
                return [];
            }
        }

        const isClient = userRole.toLowerCase() === 'client';
        const definitions = FILTER_DEFINITIONS[moduleCode.toUpperCase()] || [];

        return definitions.map(f => ({
            key: f.key,
            label: f.label,
            visible: isClient ? !f.hideForClient : true,
            valueType: 'enum'
        }));

    } catch (error) {
        console.error(`❌ Error in filterService:`, error.message);
        return [];
    }
};

/**
 * ✅ OBTENIR LES FILTRES VISIBLES UNIQUEMENT
 */
const getVisibleFiltersOnly = async (userRole, moduleCode) => {
    const allFilters = await getFilterVisibilityByRoleAndModule(userRole, moduleCode);
    return allFilters.filter(f => f.visible);
};

module.exports = {
    getFilterVisibilityByRoleAndModule,
    getVisibleFiltersOnly
};
