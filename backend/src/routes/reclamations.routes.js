const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reclamationController');
const { protect, restrictTo } = require('../middleware/auth');

// Appliquer la protection d'authentification à toutes les routes
router.use(protect);

// Routes de consultation (tous les utilisateurs authentifiés)
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/technician/:technicienID', ctrl.getTechnicianReclamations);

// Routes d'ajout/modification/suppression (réservées aux admins)
router.post('/', restrictTo('Admin'), ctrl.create);
router.put('/:id', restrictTo('Admin'), ctrl.update);
router.patch('/:id/statut', restrictTo('Admin'), ctrl.updateStatus);
router.patch('/:id/assign-technician', restrictTo('Admin'), ctrl.assignTechnician);
router.patch('/:id/remove-technician', restrictTo('Admin'), ctrl.removeTechnicianAssignment);
router.delete('/:id', restrictTo('Admin'), ctrl.remove);

module.exports = router;
