const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Categories
// Collections (as sub-route or separate logic, let's keep it here for now as they are related)
router.get('/collections/all', categoryController.getAllCollections);
router.post('/collections', categoryController.createCollection);

// Categories
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
