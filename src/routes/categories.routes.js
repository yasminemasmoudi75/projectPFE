const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

// ✅ CORRECTION: Collections avec vérification de permissions
router.get('/collections/all', checkPermission(MODULES.CATEGORIES, 'read'), categoryController.getAllCollections);
router.post('/collections', checkPermission(MODULES.CATEGORIES, 'create'), categoryController.createCollection);

// ✅ CORRECTION: Categories avec vérification complète des permissions
// READ operations (no permission check needed, but route is protected by auth)
router.get('/', checkPermission(MODULES.CATEGORIES, 'read'), categoryController.getAllCategories);
router.get('/:id', checkPermission(MODULES.CATEGORIES, 'read'), categoryController.getCategoryById);

// CREATE operation (need canAdd permission from TabAWProfileAccess)
router.post('/', checkPermission(MODULES.CATEGORIES, 'create'), categoryController.createCategory);

// UPDATE operation (need canEdit permission from TabAWProfileAccess)
router.put('/:id', checkPermission(MODULES.CATEGORIES, 'update'), categoryController.updateCategory);

// DELETE operation (need canDelt permission from TabAWProfileAccess)
router.delete('/:id', checkPermission(MODULES.CATEGORIES, 'delete'), categoryController.deleteCategory);

module.exports = router;
