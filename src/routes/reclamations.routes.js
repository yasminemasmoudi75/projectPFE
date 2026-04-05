const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reclamationController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

// Appliquer la protection d'authentification à toutes les routes
router.use(protect);

const RECLAMATIONS_MODULE = MODULES.REGLEMENT;

// Routes de consultation (tous les utilisateurs authentifiés)
router.get('/', checkPermission(RECLAMATIONS_MODULE, 'read'), ctrl.getAll);
router.get('/technician/:technicienID', checkPermission(RECLAMATIONS_MODULE, 'read'), ctrl.getTechnicianReclamations);
router.get('/:id', checkPermission(RECLAMATIONS_MODULE, 'read'), ctrl.getById);

// Routes d'ajout/modification/suppression via permissions module
router.post('/', checkPermission(RECLAMATIONS_MODULE, 'create'), ctrl.create);
router.put('/:id', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.update);
router.patch('/:id/statut', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.updateStatus);
router.patch('/:id/assign-technician', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.assignTechnician);
router.patch('/:id/remove-technician', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.removeTechnicianAssignment);
router.post('/:id/interventions', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.addIntervention);
router.delete('/:id', checkPermission(RECLAMATIONS_MODULE, 'delete'), ctrl.remove);

module.exports = router;
