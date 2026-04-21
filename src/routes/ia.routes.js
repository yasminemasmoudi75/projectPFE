const express = require('express');
const router = express.Router();

const iaProxyController = require('../controllers/iaProxyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/forecast', iaProxyController.forecast);
router.get('/satisfaction/:codTiers', iaProxyController.analyzeSatisfaction);

module.exports = router;
