const express = require('express');
const router = express.Router();
const favController = require('../controllers/favController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

router.get('/', checkPermission(MODULES.BCV, 'read'), favController.getAllFav);
router.get('/:id', checkPermission(MODULES.BCV, 'read'), favController.getFavById);

module.exports = router;
