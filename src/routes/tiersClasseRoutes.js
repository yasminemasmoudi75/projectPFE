const express = require('express');
const router = express.Router();
const tiersClasseController = require('../controllers/tiersClasseController');
const { protect } = require('../middleware/auth');

router.get('/', protect, tiersClasseController.getAll);

module.exports = router;
