const express = require('express');
const router = express.Router();
const activiteController = require('../controllers/activiteController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

router.get('/', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'read'), activiteController.getAllActivites);
router.get('/tiers-lookup', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'read'), activiteController.lookupActivityTiers);
router.get('/:id', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'read'), activiteController.getActiviteById);
router.post('/', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'create'), activiteController.createActivite);
router.patch('/:id/validate', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'update'), activiteController.validateActivite);
router.put('/:id', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'update'), activiteController.updateActivite);
router.delete('/:id', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'delete'), activiteController.deleteActivite);

module.exports = router;
