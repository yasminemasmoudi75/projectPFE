const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');
const upload = require('../config/uploadProduct');

// Apply auth middleware to all routes
router.use(protect);

router.get('/', checkPermission(MODULES.PRODUITS, 'read'), productController.getAllProducts);
router.get('/:id', checkPermission(MODULES.PRODUITS, 'read'), productController.getProductById);

// Variants (TabStockD)
router.get('/:id/variants', checkPermission(MODULES.PRODUITS, 'read'), productController.getProductVariants);
router.post('/:id/variants', checkPermission(MODULES.PRODUITS, 'update'), productController.saveProductVariants);
router.delete('/:id/variants/:variantId', checkPermission(MODULES.PRODUITS, 'delete'), productController.deleteProductVariant);

// Add upload.single('image') to handle file uploads
router.post('/', checkPermission(MODULES.PRODUITS, 'create'), upload.single('image'), productController.createProduct);
router.put('/:id', checkPermission(MODULES.PRODUITS, 'update'), upload.single('image'), productController.updateProduct);

router.delete('/:id', checkPermission(MODULES.PRODUITS, 'delete'), productController.deleteProduct);

module.exports = router;
