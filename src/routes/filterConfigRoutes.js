/**
 * filterConfigRoutes.js
 * Routes pour l'API des configurations de filtres table-driven
 */

const express = require('express');
const router = express.Router();
const filterConfigController = require('../controllers/filterConfigController');
const { protect } = require('../middleware/auth');

/**
 * ✅ GET /api/filters/health
 * Health check pour vérifier le statut de la migration (NO AUTH REQUIRED)
 */
router.get('/health', filterConfigController.healthCheck);

/**
 * ✅ GET /api/filters/:moduleCode
 * Retourne la configuration complète des filtres pour un module
 */
router.get('/:moduleCode', protect, filterConfigController.getFilterConfig);

/**
 * ✅ GET /api/filters/:moduleCode/validate/:filterKey
 * Valide la configuration d'un filtre spécifique
 */
router.get('/:moduleCode/validate/:filterKey', protect, filterConfigController.validateFilterConfig);

/**
 * ✅ POST /api/filters/test-where-clause
 * Test endpoint pour construire les clauses WHERE
 */
router.post('/test-where-clause', protect, filterConfigController.testWhereClause);

module.exports = router;
