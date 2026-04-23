const express = require('express');
const router = express.Router();
const favController = require('../controllers/favController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

// ⚠️ Routes spécifiques AVANT routes génériques avec :id
router.get('/my-invoices', checkPermission(MODULES.FACTURES, 'read'), favController.getMyFav);

router.get('/', checkPermission(MODULES.FACTURES, 'read'), favController.getAllFav);
router.get('/:id', checkPermission(MODULES.FACTURES, 'read'), favController.getFavById);
router.post('/', checkPermission(MODULES.FACTURES, 'create'), favController.createFav);
router.put('/:id', checkPermission(MODULES.FACTURES, 'update'), favController.updateFav);
router.delete('/:id', checkPermission(MODULES.FACTURES, 'delete'), favController.deleteFav);

// Transfert FAV -> BLV
router.post('/:id/transfer', checkPermission(MODULES.FACTURES, 'update'), favController.transferFav);

module.exports = router;
