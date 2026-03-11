const express = require('express');
const router = express.Router();
const activiteController = require('../controllers/activiteController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

router.get('/', checkPermission(MODULES.ACTIVITES, 'read'), activiteController.getAllActivites);
router.get('/:id', checkPermission(MODULES.ACTIVITES, 'read'), activiteController.getActiviteById);
router.post('/', checkPermission(MODULES.ACTIVITES, 'create'), activiteController.createActivite);
router.put('/:id', checkPermission(MODULES.ACTIVITES, 'update'), activiteController.updateActivite);
router.delete('/:id', checkPermission(MODULES.ACTIVITES, 'delete'), activiteController.deleteActivite);

module.exports = router;
