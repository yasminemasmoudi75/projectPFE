const express = require('express');
const router = express.Router();
const activiteController = require('../controllers/activiteController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', activiteController.getAllActivites);
router.get('/:id', activiteController.getActiviteById);
router.post('/', activiteController.createActivite);
router.put('/:id', activiteController.updateActivite);
router.delete('/:id', restrictTo('Admin'), activiteController.deleteActivite);

module.exports = router;
