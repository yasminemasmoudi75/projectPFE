const express = require('express');
const router = express.Router();
const tiersGouvernoratController = require('../controllers/tiersGouvernoratController');
const { protect } = require('../middleware/auth');

router.get('/', protect, tiersGouvernoratController.getAll);

module.exports = router;
