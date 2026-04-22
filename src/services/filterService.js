/**
 * filterService.js
 * Service pour gérer la visibilité des filtres par rôle et module
 * Utilise la table TABAWPROFILEACCESS pour mapper les colonnes aux filtres UI
 */

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { MODULE_MAPPING, FILTER_DEFINITIONS } = require('../utils/filterDefinitions');

/**
 * ✅ OBTENIR LES FILTRES VISIBLES POUR UN RÔLE ET UN MODULE
 * Mappe les colonnes de TABAWPROFILEACCESS à la visibilité des filtres
 */
const getFilterVisibilityByRoleAndModule = async (userRole, moduleCode) => {
    try {
        console.log(`🔍 filterService: Getting filters for role="${userRole}", module="${moduleCode}"`);

        const numericModCode = MODULE_MAPPING[moduleCode.toUpperCase()];
        let permissions = { Actif: 1, FiltreRepres: 1, FiltreMag: 1, CtrlStk: 1 };

        if (numericModCode) {
            const rows = await sequelize.query(`
                SELECT Actif, FiltreRepres, FiltreMag, FiltreChauffeur, CtrlStk, CanImp, canPDF
                FROM TABAWPROFILEACCESS
                WHERE LOWER(ProfileUser) = LOWER(:userRole) AND CodMod = :modCode
            `, {
                replacements: { userRole, modCode: numericModCode },
                type: QueryTypes.SELECT
            });

            if (rows.length > 0) {
                permissions = rows[0];
            }

            // Si le module n'est pas actif pour ce rôle, on ne retourne aucun filtre
            if (permissions.Actif === 0) {
                console.log(`🚫 Access denied for module ${moduleCode} for role ${userRole}`);
                return [];
            }
        }

        const definitions = FILTER_DEFINITIONS[moduleCode.toUpperCase()] || [];

        return definitions.map(f => {
            let isVisible = true;

            // Logique de mappage intelligente :
            // On utilise les colonnes existantes de TABAWPROFILEACCESS pour piloter la visibilité UI
            if (moduleCode.toUpperCase() === 'STOCK') {
                if (f.key === 'low') isVisible = permissions.CtrlStk === 1; // "Stock Faible" lié à CtrlStk
                if (f.key === 'ok') isVisible = permissions.FiltreMag === 1;  // "Dispo" lié à FiltreMag
                if (f.key === 'rupture') isVisible = permissions.FiltreChauffeur === 1; // "Rupture" lié à FiltreChauffeur
            }
            else if (moduleCode.toUpperCase() === 'RECLAMATION') {
                if (f.key === 'priority_urgent') isVisible = permissions.FiltreRepres === 1; // "Urgent" lié à FiltreRepres
            }
            // Par défaut pour les autres, on garde la visibilité de base ou on peut ajouter d'autres liens ici

            return {
                key: f.key,
                label: f.label,
                visible: isVisible,
                valueType: 'enum'
            };
        });

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
