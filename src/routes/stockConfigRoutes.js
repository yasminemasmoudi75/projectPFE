const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stockConfigController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getConfig);
router.put('/', ctrl.updateConfig);

module.exports = router;
