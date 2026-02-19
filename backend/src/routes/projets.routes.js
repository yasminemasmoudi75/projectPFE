const express = require('express');
const router = express.Router();
const projetController = require('../controllers/projetController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

router.get('/', projetController.getProjets);
router.get('/:id', projetController.getProjetById);
router.post('/', projetController.createProjet);
router.put('/:id', projetController.updateProjet);
router.delete('/:id', restrictTo('Admin'), projetController.deleteProjet);

module.exports = router;
