const express = require('express');
const router = express.Router();
const tiersController = require('../controllers/tiersController');
const { protect, restrictTo } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

// Toutes les routes sont protégées
router.use(protect);

// Routes statiques d'abord
router.get('/me', tiersController.getMyTiers);
router.get('/regions/list', checkPermission(MODULES.TIERS, 'read'), tiersController.getVilles);
router.get('/available-commercials', checkPermission(MODULES.TIERS, 'read'), tiersController.getAvailableCommercials);
router.get('/check-email', checkPermission(MODULES.TIERS, 'read'), tiersController.checkTierEmailUnique);
router.get('/next-code', checkPermission(MODULES.TIERS, 'read'), tiersController.getNextCodTiers);

// Classe calculée automatiquement via ViewCalculClasseContact
router.get('/:id/classe-calculee', checkPermission(MODULES.TIERS, 'read'), tiersController.getClasseCalculee);

// Envoi en masse des identifiants aux clients (admin uniquement)
router.post('/bulk-send-credentials', restrictTo('Admin'), tiersController.bulkSendCredentials);

// Routes CRUD avec pattern /:id
router.route('/')
    .get(checkPermission(MODULES.TIERS, 'read'), tiersController.getAllTiers)
    .post(checkPermission(MODULES.TIERS, 'create'), tiersController.createTiers);

router.route('/:id')
    .get(checkPermission(MODULES.TIERS, 'read'), tiersController.getTiersById)
    .put(checkPermission(MODULES.TIERS, 'update'), tiersController.updateTiers)
    .delete(checkPermission(MODULES.TIERS, 'delete'), tiersController.deleteTiers);

module.exports = router;
