const express = require('express');
const router = express.Router();
const tiersCategorieController = require('../controllers/tiersCategorieController');

router.get('/', tiersCategorieController.getAll);

module.exports = router;
