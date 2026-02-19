const express = require('express');
const router = express.Router();
const objectifController = require('../controllers/objectifController');
const { protect, restrictTo } = require('../middleware/auth');

// Toutes les routes d'objectifs sont protégées
router.use(protect);

router.get('/', objectifController.getAllObjectifs);
router.get('/:id', objectifController.getObjectifById);

// Seuls les Admins et Managers peuvent créer, modifier ou supprimer des objectifs (à adapter selon vos besoins)
router.post('/', restrictTo('Admin', 'Manager'), objectifController.createObjectif);
router.put('/:id', restrictTo('Admin', 'Manager'), objectifController.updateObjectif);
router.delete('/:id', restrictTo('Admin'), objectifController.deleteObjectif);

module.exports = router;
