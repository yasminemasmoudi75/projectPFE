const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reclamationController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

// Appliquer la protection d'authentification à toutes les routes
router.use(protect);

// Routes de consultation (tous les utilisateurs authentifiés)
router.get('/', checkPermission(MODULES.RECLAMATIONS, 'read'), ctrl.getAll);
router.get('/:id', checkPermission(MODULES.RECLAMATIONS, 'read'), ctrl.getById);
router.get('/technician/:technicienID', checkPermission(MODULES.RECLAMATIONS, 'read'), ctrl.getTechnicianReclamations);

// Routes d'ajout/modification/suppression via permissions module
router.post('/', checkPermission(MODULES.RECLAMATIONS, 'create'), ctrl.create);
router.put('/:id', checkPermission(MODULES.RECLAMATIONS, 'update'), ctrl.update);
router.patch('/:id/statut', checkPermission(MODULES.RECLAMATIONS, 'update'), ctrl.updateStatus);
router.patch('/:id/assign-technician', checkPermission(MODULES.RECLAMATIONS, 'update'), ctrl.assignTechnician);
router.patch('/:id/remove-technician', checkPermission(MODULES.RECLAMATIONS, 'update'), ctrl.removeTechnicianAssignment);
router.delete('/:id', checkPermission(MODULES.RECLAMATIONS, 'delete'), ctrl.remove);

module.exports = router;
