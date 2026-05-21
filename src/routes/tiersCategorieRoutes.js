const express = require('express');
const router = express.Router();
const tiersCategorieController = require('../controllers/tiersCategorieController');
const { protect } = require('../middleware/auth');

router.get('/', protect, tiersCategorieController.getAll);

module.exports = router;
