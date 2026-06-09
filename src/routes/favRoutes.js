const express = require('express');
const router = express.Router();
const favController = require('../controllers/favController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkSignaturePermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

// ⚠️ Routes spécifiques AVANT routes génériques avec :id
router.get('/my-invoices', checkPermission(MODULES.FACTURES, 'read'), favController.getMyFav);

router.get('/:id/pdf', checkPermission(MODULES.FACTURES, 'read'), favController.generateFavPDF);
router.get('/', checkPermission(MODULES.FACTURES, 'read'), favController.getAllFav);
router.get('/:id', checkPermission(MODULES.FACTURES, 'read'), favController.getFavById);
router.post('/', checkPermission(MODULES.FACTURES, 'create'), favController.createFav);
router.patch('/:id/validate', checkPermission(MODULES.FACTURES, 'update'), favController.validateFav);
router.put('/:id', checkPermission(MODULES.FACTURES, 'update'), favController.updateFav);
router.delete('/:id', checkPermission(MODULES.FACTURES, 'delete'), favController.deleteFav);
router.patch('/:id/signature', checkSignaturePermission(MODULES.FACTURES), favController.saveSignatureFav);
router.delete('/:id/signature', checkSignaturePermission(MODULES.FACTURES), favController.deleteSignatureFav);
router.patch('/:id/client-signature', checkSignaturePermission(MODULES.FACTURES), favController.saveClientSignatureFav);
router.delete('/:id/client-signature', checkSignaturePermission(MODULES.FACTURES), favController.deleteClientSignatureFav);

module.exports = router;
