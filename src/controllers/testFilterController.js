/**
 * testFilterController.js
 * Contrôleur pour tester la table TabRoleFilterVisibility et le service filterService
 */

const filterService = require('../services/filterService');

/**
 * 🧪 TEST 1: Vérifier la connexion à la table
 */
exports.testConnection = async (req, res) => {
    try {
        console.log('🧪 [TEST 1] Testing table connection...');
        
        const rowCount = await filterService.testConnection();
        
        return res.status(200).json({
            status: 'success',
            message: 'Table connection OK',
            data: {
                tableExists: true,
                totalRows: rowCount
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Table connection failed',
            error: error.message
        });
    }
};

/**
 * 🧪 TEST 2: Obtenir tous les filtres pour un rôle + module
 * GET /api/test/filters/:role/:module
 * Exemple: GET /api/test/filters/client/STOCK
 */
exports.getFiltersByRoleModule = async (req, res) => {
    try {
        const { role, module } = req.params;
        
        console.log(`🧪 [TEST 2] Getting filters for role=${role}, module=${module}`);
        
        const filters = await filterService.getFilterVisibilityByRoleAndModule(role, module);
        
        return res.status(200).json({
            status: 'success',
            message: `Filters for ${role}/${module}`,
            data: {
                role,
                module,
                totalFilters: filters.length,
                filters: filters
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error fetching filters',
            error: error.message
        });
    }
};

/**
 * 🧪 TEST 3: Obtenir SEULEMENT les filtres visibles
 * GET /api/test/visible-filters/:role/:module
 * Exemple: GET /api/test/visible-filters/client/STOCK
 */
exports.getVisibleFilters = async (req, res) => {
    try {
        const { role, module } = req.params;
        
        console.log(`🧪 [TEST 3] Getting VISIBLE filters for role=${role}, module=${module}`);
        
        const visibleFilters = await filterService.getVisibleFiltersOnly(role, module);
        
        return res.status(200).json({
            status: 'success',
            message: `Visible filters for ${role}/${module}`,
            data: {
                role,
                module,
                visibleCount: visibleFilters.length,
                filters: visibleFilters
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error fetching visible filters',
            error: error.message
        });
    }
};

/**
 * 🧪 TEST 4: Obtenir tous les rôles disponibles
 * GET /api/test/roles
 */
exports.getAllRoles = async (req, res) => {
    try {
        console.log('🧪 [TEST 4] Getting all roles...');
        
        const roles = await filterService.getAllRoles();
        
        return res.status(200).json({
            status: 'success',
            message: 'All available roles',
            data: {
                totalRoles: roles.length,
                roles: roles
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error fetching roles',
            error: error.message
        });
    }
};

/**
 * 🧪 TEST 5: Obtenir tous les modules disponibles
 * GET /api/test/modules
 */
exports.getAllModules = async (req, res) => {
    try {
        console.log('🧪 [TEST 5] Getting all modules...');
        
        const modules = await filterService.getAllModules();
        
        return res.status(200).json({
            status: 'success',
            message: 'All available modules',
            data: {
                totalModules: modules.length,
                modules: modules
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error fetching modules',
            error: error.message
        });
    }
};

/**
 * 🧪 TEST 6: Obtenir les statistiques de la table
 * GET /api/test/stats
 */
exports.getTableStats = async (req, res) => {
    try {
        console.log('🧪 [TEST 6] Getting table statistics...');
        
        const stats = await filterService.getTableStats();
        
        return res.status(200).json({
            status: 'success',
            message: 'Table statistics',
            data: stats
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error fetching stats',
            error: error.message
        });
    }
};

/**
 * 🧪 TEST 7: Obtenir tous les filtres pour un module (tous les rôles)
 * GET /api/test/module/:module
 * Exemple: GET /api/test/module/STOCK
 */
exports.getAllFiltersForModule = async (req, res) => {
    try {
        const { module } = req.params;
        
        console.log(`🧪 [TEST 7] Getting all filters for module=${module}`);
        
        const filters = await filterService.getAllFiltersForModule(module);
        
        // Grouper par rôle
        const grouped = {};
        filters.forEach(f => {
            if (!grouped[f.ProfileUser]) {
                grouped[f.ProfileUser] = [];
            }
            grouped[f.ProfileUser].push({
                key: f.FilterKey,
                label: f.FilterLabel,
                visible: f.VisibleForRole === 1
            });
        });
        
        return res.status(200).json({
            status: 'success',
            message: `All filters for module ${module}`,
            data: {
                module,
                totalFilters: filters.length,
                byRole: grouped
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error fetching module filters',
            error: error.message
        });
    }
};

/**
 * 🧪 TEST 8: DASHBOARD DE TOUS LES TESTS
 * GET /api/test/dashboard
 */
exports.testDashboard = async (req, res) => {
    try {
        console.log('🧪 [TEST 8] Getting complete test dashboard...');
        
        const [stats, roles, modules] = await Promise.all([
            filterService.getTableStats(),
            filterService.getAllRoles(),
            filterService.getAllModules()
        ]);
        
        // Pour chaque module/rôle, obtenir les filtres
        const filterMatrix = {};
        for (const role of roles) {
            for (const module of modules) {
                const key = `${role}/${module}`;
                const filters = await filterService.getVisibleFiltersOnly(role, module);
                filterMatrix[key] = {
                    role,
                    module,
                    visibleCount: filters.length,
                    filters: filters.map(f => f.key)
                };
            }
        }
        
        return res.status(200).json({
            status: 'success',
            message: 'Complete test dashboard',
            data: {
                stats,
                roles,
                modules,
                filterMatrix
            }
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error building dashboard',
            error: error.message
        });
    }
};
