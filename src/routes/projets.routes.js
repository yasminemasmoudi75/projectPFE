const express = require('express');
const router = express.Router();
const projetController = require('../controllers/projetController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

router.get('/', checkPermission(MODULES.PROJETS, 'read'), projetController.getProjets);
router.get('/tiers-lookup', checkPermission(MODULES.PROJETS, 'read'), projetController.lookupProjetTiers);
router.get('/:id', checkPermission(MODULES.PROJETS, 'read'), projetController.getProjetById);
router.post('/', checkPermission(MODULES.PROJETS, 'create'), projetController.createProjet);
router.put('/:id', checkPermission(MODULES.PROJETS, 'update'), projetController.updateProjet);
router.delete('/:id', checkPermission(MODULES.PROJETS, 'delete'), projetController.deleteProjet);

module.exports = router;
