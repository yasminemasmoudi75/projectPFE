/**
 * testFilterRoutes.js
 * Routes pour tester la table TabRoleFilterVisibility
 */

const express = require('express');
const router = express.Router();
const testFilterController = require('../controllers/testFilterController');
const { protect, restrictTo } = require('../middleware/auth');

// All test routes require authentication and admin role
router.use(protect, restrictTo('admin', 'administrateur'));

/**
 * 🧪 ROUTES DE TEST (admin only)
 * Format: GET /api/test/...
 */

// TEST 1: Vérifier la connexion à la table
router.get('/test/connection', testFilterController.testConnection);

// TEST 2: Obtenir tous les filtres pour un rôle + module
router.get('/test/filters/:role/:module', testFilterController.getFiltersByRoleModule);

// TEST 3: Obtenir SEULEMENT les filtres visibles
router.get('/test/visible-filters/:role/:module', testFilterController.getVisibleFilters);

// TEST 4: Obtenir tous les rôles
router.get('/test/roles', testFilterController.getAllRoles);

// TEST 5: Obtenir tous les modules
router.get('/test/modules', testFilterController.getAllModules);

// TEST 6: Obtenir les stats de la table
router.get('/test/stats', testFilterController.getTableStats);

// TEST 7: Obtenir tous les filtres pour un module
router.get('/test/module/:module', testFilterController.getAllFiltersForModule);

// TEST 8: Dashboard complet
router.get('/test/dashboard', testFilterController.testDashboard);

module.exports = router;
