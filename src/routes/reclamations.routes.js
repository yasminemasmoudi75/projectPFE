const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reclamationController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');
const { resolveUserAccess } = require('../utils/userAccess');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

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
const allowTechnicianOnOwnClaimOrUpdatePermission = (req, res, next) => {
	(async () => {
		const userId = req.user?.id || req.user?.UserID;
		const claimId = req.params.id;
		const access = await resolveUserAccess(userId, req.user?.UserRole);
		
		// If admin, apply standard update permission check
		if (access?.normalizedRole === 'admin') {
			return checkPermission(RECLAMATIONS_MODULE, 'update')(req, res, next);
		}
		
		// If technician, check if claim is assigned to them
		if (access?.normalizedRole === 'technicien') {
			try {
				const claims = await sequelize.query(
					`SELECT TechnicienID, NomTechnicien FROM TabReclamation WHERE ID = :id`,
					{ replacements: { id: claimId }, type: QueryTypes.SELECT }
				);

				if (claims && claims[0]) {
					const claimTechnicienId = claims[0].TechnicienID;
					const claimTechnicienName = String(claims[0].NomTechnicien || '').trim().toLowerCase();
					const userFullName = String(req.user?.FullName || '').trim().toLowerCase();
					const userLogin = String(req.user?.LoginName || '').trim().toLowerCase();
					const userEmail = String(req.user?.EmailPro || '').trim().toLowerCase();

					const idMatch = claimTechnicienId === userId || claimTechnicienId == userId;
					const nameMatch = Boolean(
						claimTechnicienName && (
							claimTechnicienName === userFullName ||
							claimTechnicienName === userLogin ||
							claimTechnicienName === userEmail
						)
					);

					if (idMatch || nameMatch) {
						return next(); // Technician owns this claim
					}
				}
			} catch (dbError) {
				// If query fails, fall through to permission check
				console.error('Error checking claim assignment:', dbError);
			}
		}
		
		// Otherwise, apply standard update permission check
		return checkPermission(RECLAMATIONS_MODULE, 'update')(req, res, next);
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
router.post('/:id/interventions', allowTechnicianOnOwnClaimOrUpdatePermission, ctrl.addIntervention);
router.get('/technician/:technicienID', checkPermission(RECLAMATIONS_MODULE, 'read'), ctrl.getTechnicianReclamations);

// Routes générales (après les routes spécifiques)
router.get('/', allowClientOrReadPermission, ctrl.getAll);
router.get('/:id', allowClientOrReadPermission, ctrl.getById);

// Routes d'ajout/modification/suppression via permissions module
router.post('/', allowClientOrCreatePermission, ctrl.create);
router.put('/:id', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.update);
router.patch('/:id/statut', allowTechnicianOnOwnClaimOrUpdatePermission, ctrl.updateStatus);
router.patch('/:id/assign-technician', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.assignTechnician);
router.patch('/:id/remove-technician', checkPermission(RECLAMATIONS_MODULE, 'update'), ctrl.removeTechnicianAssignment);
router.delete('/:id', checkPermission(RECLAMATIONS_MODULE, 'delete'), ctrl.remove);

module.exports = router;
