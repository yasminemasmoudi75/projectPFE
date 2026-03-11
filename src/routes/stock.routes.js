const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');
const upload = require('../config/uploadProduct');

// Apply auth middleware to all routes
router.use(protect);

// Get all stocks
router.get('/', checkPermission(MODULES.PRODUITS, 'read'), stockController.getAllStocks);

// Search stocks
router.get('/search', checkPermission(MODULES.PRODUITS, 'read'), stockController.searchStocks);

// Get low stocks
router.get('/low-stock', checkPermission(MODULES.PRODUITS, 'read'), stockController.getLowStocks);

// Get stock by ID
router.get('/:id', checkPermission(MODULES.PRODUITS, 'read'), stockController.getStockById);

// Upload image for stock
router.post('/:id/image', checkPermission(MODULES.PRODUITS, 'update'), upload.single('image'), stockController.uploadStockImage);

module.exports = router;
