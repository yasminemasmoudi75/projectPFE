const express = require('express');
const router = express.Router();
const blvController = require('../controllers/blvController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

router.get('/', checkPermission(MODULES.LIVRAISONS, 'read'), blvController.getAllBlv);
router.get('/:id', checkPermission(MODULES.LIVRAISONS, 'read'), blvController.getBlvById);
router.post('/', checkPermission(MODULES.LIVRAISONS, 'create'), blvController.createBlv);
router.put('/:id', checkPermission(MODULES.LIVRAISONS, 'update'), blvController.updateBlv);
router.delete('/:id', checkPermission(MODULES.LIVRAISONS, 'delete'), blvController.deleteBlv);

module.exports = router;
