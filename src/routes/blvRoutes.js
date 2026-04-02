const express = require('express');
const router = express.Router();
const blvController = require('../controllers/blvController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

router.get('/', checkPermission(MODULES.BCV, 'read'), blvController.getAllBlv);
router.get('/:id', checkPermission(MODULES.BCV, 'read'), blvController.getBlvById);
router.post('/', checkPermission(MODULES.BCV, 'create'), blvController.createBlv);
router.put('/:id', checkPermission(MODULES.BCV, 'update'), blvController.updateBlv);
router.delete('/:id', checkPermission(MODULES.BCV, 'delete'), blvController.deleteBlv);

module.exports = router;
