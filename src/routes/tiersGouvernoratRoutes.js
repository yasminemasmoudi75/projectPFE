const express = require('express');
const router = express.Router();
const tiersGouvernoratController = require('../controllers/tiersGouvernoratController');

router.get('/', tiersGouvernoratController.getAll);

module.exports = router;
