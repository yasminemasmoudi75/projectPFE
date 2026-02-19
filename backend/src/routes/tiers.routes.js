const express = require('express');
const router = express.Router();
const tiersController = require('../controllers/tiersController');
const { protect, restrictTo } = require('../middleware/auth');

// Toutes les routes sont protégées
router.use(protect);

// Routes Tiers
router.route('/')
    .get(tiersController.getAllTiers)
    .post(restrictTo('Admin', 'Commercial'), tiersController.createTiers);

router.route('/:id')
    .get(tiersController.getTiersById)
    .put(restrictTo('Admin', 'Commercial'), tiersController.updateTiers)
    .delete(restrictTo('Admin'), tiersController.deleteTiers); // Seul l'Admin peut supprimer

module.exports = router;
