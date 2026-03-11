const express = require('express');
const router = express.Router();
const bcvController = require('../controllers/bcvController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

// GET /api/bcv           — liste paginée des bons de commande
router.get('/', checkPermission(MODULES.BCV, 'read'), bcvController.getAllBcv);

// GET /api/bcv/:id       — détail d'un bon de commande (+ lignes)
router.get('/:id', checkPermission(MODULES.BCV, 'read'), bcvController.getBcvById);

module.exports = router;
