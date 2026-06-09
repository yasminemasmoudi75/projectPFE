const express = require('express');
const router = express.Router();

const iaProxyController = require('../controllers/iaProxyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/forecast', iaProxyController.forecast);
router.get('/satisfaction/:codTiers', iaProxyController.analyzeSatisfaction);
router.post('/generate-email', iaProxyController.generateEmail);
router.post('/reformulate-email', iaProxyController.reformulateEmail);
router.post('/chat', iaProxyController.chat);

module.exports = router;
