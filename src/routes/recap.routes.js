const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const recapController = require('../controllers/recapController');

router.get('/', protect, recapController.getAllRecap);
router.get('/:codTiers', protect, recapController.getRecapByTiers);

module.exports = router;
