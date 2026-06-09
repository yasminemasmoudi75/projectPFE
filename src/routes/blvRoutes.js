const express = require('express');
const router = express.Router();
const blvController = require('../controllers/blvController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkSignaturePermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

// ⚠️ Routes spécifiques AVANT routes génériques avec :id
router.get('/my-deliveries', checkPermission(MODULES.LIVRAISONS, 'read'), blvController.getMyBlv);

router.get('/:id/pdf', checkPermission(MODULES.LIVRAISONS, 'read'), blvController.generateBlvPDF);
router.get('/', checkPermission(MODULES.LIVRAISONS, 'read'), blvController.getAllBlv);
router.get('/:id', checkPermission(MODULES.LIVRAISONS, 'read'), blvController.getBlvById);
router.post('/', checkPermission(MODULES.LIVRAISONS, 'create'), blvController.createBlv);
router.patch('/:id/validate', checkPermission(MODULES.LIVRAISONS, 'update'), blvController.validateBlv);
router.put('/:id', checkPermission(MODULES.LIVRAISONS, 'update'), blvController.updateBlv);
router.delete('/:id', checkPermission(MODULES.LIVRAISONS, 'delete'), blvController.deleteBlv);
router.patch('/:id/signature', checkSignaturePermission(MODULES.LIVRAISONS), blvController.saveSignatureBlv);
router.delete('/:id/signature', checkSignaturePermission(MODULES.LIVRAISONS), blvController.deleteSignatureBlv);
router.patch('/:id/client-signature', checkSignaturePermission(MODULES.LIVRAISONS), blvController.saveClientSignatureBlv);
router.delete('/:id/client-signature', checkSignaturePermission(MODULES.LIVRAISONS), blvController.deleteClientSignatureBlv);

module.exports = router;
