const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../config/uploadProduct');

// Apply auth middleware to all routes
router.use(protect);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Add upload.single('image') to handle file uploads
router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);

router.delete('/:id', productController.deleteProduct);

module.exports = router;
