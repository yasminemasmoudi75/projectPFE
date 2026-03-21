const express = require('express');
const router = express.Router();
const tiersController = require('../controllers/tiersController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

// Toutes les routes sont protégées
router.use(protect);

// Routes statiques d'abord
router.get('/regions/list', checkPermission(MODULES.TIERS, 'read'), tiersController.getVilles);

// Routes CRUD avec pattern /:id
router.route('/')
    .get(checkPermission(MODULES.TIERS, 'read'), tiersController.getAllTiers)
    .post(checkPermission(MODULES.TIERS, 'create'), tiersController.createTiers);

router.route('/:id')
    .get(checkPermission(MODULES.TIERS, 'read'), tiersController.getTiersById)
    .put(checkPermission(MODULES.TIERS, 'update'), tiersController.updateTiers)
    .delete(checkPermission(MODULES.TIERS, 'delete'), tiersController.deleteTiers);

module.exports = router;
