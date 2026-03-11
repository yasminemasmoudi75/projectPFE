const express = require('express');
const router = express.Router();
const objectifController = require('../controllers/objectifController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

// Toutes les routes d'objectifs sont protégées
router.use(protect);

// GET : lecture (tous les rôles ayant accès au module Objectifs)
router.get('/', checkPermission(MODULES.OBJECTIFS, 'read'), objectifController.getAllObjectifs);
router.get('/:id', checkPermission(MODULES.OBJECTIFS, 'read'), objectifController.getObjectifById);

// POST : nécessite canAdd=1 dans TabAWProfileAccess
router.post('/', checkPermission(MODULES.OBJECTIFS, 'create'), objectifController.createObjectif);

// PUT : nécessite canEdit=1 dans TabAWProfileAccess
router.put('/:id', checkPermission(MODULES.OBJECTIFS, 'update'), objectifController.updateObjectif);

// DELETE : nécessite canDelt=1 dans TabAWProfileAccess
router.delete('/:id', checkPermission(MODULES.OBJECTIFS, 'delete'), objectifController.deleteObjectif);

module.exports = router;
