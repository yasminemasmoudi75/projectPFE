const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');
const { resolveUserAccess } = require('../utils/userAccess');
const upload = require('../config/uploadProduct');

// Apply auth middleware to all routes
router.use(protect);

const allowClientOrProductRead = (req, res, next) => {
	(async () => {
		const userId = req.user?.id || req.user?.UserID;
		const access = await resolveUserAccess(userId, req.user?.UserRole);
		const role = access?.normalizedRole;
		if (['client', 'commercial', 'admin'].includes(role)) return next();
		return checkPermission(MODULES.PRODUITS, 'read')(req, res, next);
	})().catch((error) => {
		return res.status(500).json({
			status: 'error',
			message: 'Erreur de vérification du rôle utilisateur',
			error: error.message,
		});
	});
};

router.get('/', allowClientOrProductRead, productController.getAllProducts);
router.get('/:id', allowClientOrProductRead, productController.getProductById);

// Variants (TabStockD)
router.get('/:id/variants', allowClientOrProductRead, productController.getProductVariants);
router.post('/:id/variants', checkPermission(MODULES.PRODUITS, 'update'), productController.saveProductVariants);
router.delete('/:id/variants/:variantId', checkPermission(MODULES.PRODUITS, 'delete'), productController.deleteProductVariant);

// Add upload.single('image') to handle file uploads
router.post('/', checkPermission(MODULES.PRODUITS, 'create'), upload.single('image'), productController.createProduct);
router.put('/:id', checkPermission(MODULES.PRODUITS, 'update'), upload.single('image'), productController.updateProduct);

router.delete('/:id', checkPermission(MODULES.PRODUITS, 'delete'), productController.deleteProduct);

module.exports = router;
