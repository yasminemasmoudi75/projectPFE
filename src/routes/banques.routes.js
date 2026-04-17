const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const banquesController = require('../controllers/banquesController');
const upload = require('../config/uploadBanque');

router.use(protect);

router.get('/', banquesController.getAllBanques);
router.post('/', upload.single('photo'), banquesController.createBanque);

module.exports = router;
