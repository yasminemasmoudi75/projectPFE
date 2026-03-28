const express = require('express');
const router = express.Router();
const tiersClasseController = require('../controllers/tiersClasseController');

router.get('/', tiersClasseController.getAll);

module.exports = router;
