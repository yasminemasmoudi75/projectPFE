const express = require('express');
const router = express.Router();
const bcvController = require('../controllers/bcvController');

// GET /api/bcv           — liste paginée des bons de commande
router.get('/', bcvController.getAllBcv);

// GET /api/bcv/:id       — détail d'un bon de commande (+ lignes)
router.get('/:id', bcvController.getBcvById);

module.exports = router;
