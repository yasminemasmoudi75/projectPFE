const express = require('express');
const router = express.Router();
const blvController = require('../controllers/blvController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

router.get('/', checkPermission(MODULES.BCV, 'read'), blvController.getAllBlv);
router.get('/:id', checkPermission(MODULES.BCV, 'read'), blvController.getBlvById);

module.exports = router;
