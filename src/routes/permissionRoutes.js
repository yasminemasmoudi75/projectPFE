const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { protect } = require('../middleware/auth');

// Routes publiques
// (Aucune)

// Routes protégées - nécessitent authentification
/**
 * GET /api/permissions/my-permissions
 * Retourne toutes les permissions de l'utilisateur connecté
 */
router.get('/my-permissions', protect, permissionController.getMyPermissions);

/**
 * GET /api/permissions/module/:codMod
 * Retourne la permission pour un module spécifique
 */
router.get('/module/:codMod', protect, permissionController.getModulePermission);

/**
 * GET /api/permissions/all
 * Retourne TOUTES les permissions (admin seulement)
 */
router.get('/all', protect, permissionController.getAllPermissions);

/**
 * PUT /api/permissions/update
 * Met à jour une permission (admin seulement)
 */
router.put('/update', protect, permissionController.updatePermissions);

module.exports = router;
