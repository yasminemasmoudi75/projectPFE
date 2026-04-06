const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reclamationController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');
const { resolveUserAccess } = require('../utils/userAccess');

// Appliquer la protection d'authentification à toutes les routes
router.use(protect);

const RECLAMATIONS_MODULE = MODULES.REGLEMENT;
const allowClientOrReadPermission = (req, res, next) => {
	(async () => {
		const userId = req.user?.id || req.user?.UserID;
		const access = await resolveUserAccess(userId, req.user?.UserRole);
		if (access?.normalizedRole === 'client') return next();
		return checkPermission(RECLAMATIONS_MODULE, 'read')(req, res, next);
	})().catch((error) => {
		return res.status(500).json({
			status: 'error',
			message: 'Erreur de vérification du rôle utilisateur',
			error: error.message,
		});
	});
};
const allowClientOrCreatePermission = (req, res, next) => {
	(async () => {
		const userId = req.user?.id || req.user?.UserID;
		const access = await resolveUserAccess(userId, req.user?.UserRole);
		if (access?.normalizedRole === 'client') return next();
		return checkPermission(RECLAMATIONS_MODULE, 'create')(req, res, next);
	})().catch((error) => {
		return res.status(500).json({
			status: 'error',
			message: 'Erreur de vérification du rôle utilisateur',
			error: error.message,
		});
	});
};

// ⚠️ Important: Routes plus spécifiques AVANT routes génériques
// Routes de consultation (tous les utilisateurs authentifiés)
router.get('/my-claims', allowClientOrReadPermission, ctrl.getMyMyClaims);
router.post('/:id/interventions', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.addIntervention);
router.get('/technician/:technicienID', checkPermission(RECLAMATIONS_MODULE, 'read'), ctrl.getTechnicianReclamations);

// Routes générales (après les routes spécifiques)
router.get('/', checkPermission(RECLAMATIONS_MODULE, 'read'), ctrl.getAll);
router.get('/:id', allowClientOrReadPermission, ctrl.getById);

// Routes d'ajout/modification/suppression via permissions module
router.post('/', allowClientOrCreatePermission, ctrl.create);
router.put('/:id', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.update);
router.patch('/:id/statut', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.updateStatus);
router.patch('/:id/assign-technician', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.assignTechnician);
router.patch('/:id/remove-technician', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.removeTechnicianAssignment);
router.delete('/:id', checkPermission(RECLAMATIONS_MODULE, 'delete'), ctrl.remove);

module.exports = router;
