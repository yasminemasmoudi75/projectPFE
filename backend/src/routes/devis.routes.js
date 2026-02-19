const express = require('express');
const router = express.Router();
const devisController = require('../controllers/devisController');

// Routes devis
router.get('/', devisController.getAllDevis);
router.get('/:id', devisController.getDevisById);
router.post('/', devisController.createDevis);
router.put('/:id', devisController.updateDevis);
router.delete('/:id', devisController.deleteDevis);

module.exports = router;

