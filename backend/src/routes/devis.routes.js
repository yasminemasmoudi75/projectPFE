const express = require('express');
const router = express.Router();
const devisController = require('../controllers/devisController');

// Route for orders (converted devis) - MUST BE BEFORE /:id route
router.get('/orders/all', devisController.getAllOrders);

// Routes devis
router.get('/', devisController.getAllDevis);
router.get('/:id', devisController.getDevisById);
router.post('/', devisController.createDevis);
router.put('/:id', devisController.updateDevis);
router.patch('/:id/validate', devisController.validateDevis);
router.patch('/:id/convert', devisController.convertDevis);
router.delete('/:id', devisController.deleteDevis);

module.exports = router;

