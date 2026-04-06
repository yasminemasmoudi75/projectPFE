const express = require('express');
const router = express.Router();
const devisController = require('../controllers/devisController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

// ⚠️ Routes spécifiques AVANT routes génériques avec :id
router.get('/my-quotations', checkPermission(MODULES.DEVIS, 'read'), devisController.getMyDevis);

// Routes devis
router.get('/', checkPermission(MODULES.DEVIS, 'read'), devisController.getAllDevis);
router.get('/:id', checkPermission(MODULES.DEVIS, 'read'), devisController.getDevisById);
router.get('/:id/pdf', checkPermission(MODULES.DEVIS, 'read'), devisController.generateDevisPDF);
router.post('/', checkPermission(MODULES.DEVIS, 'create'), devisController.createDevis);
router.put('/:id', checkPermission(MODULES.DEVIS, 'update'), devisController.updateDevis);
router.patch('/:id/validate', checkPermission(MODULES.DEVIS, 'update'), devisController.validateDevis);
router.patch('/:id/convert', checkPermission(MODULES.DEVIS, 'update'), devisController.convertDevis);
router.delete('/:id', checkPermission(MODULES.DEVIS, 'delete'), devisController.deleteDevis);

module.exports = router;

