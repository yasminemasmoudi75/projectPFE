const express = require('express');
const router = express.Router();
const dashboardStatController = require('../controllers/dashboardStatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/products-yield', dashboardStatController.getProductYield);
router.get('/goal-predictions', dashboardStatController.getGoalPredictions);
router.get('/recommendations/:commercialId', dashboardStatController.getCommercialRecommendations);
router.get('/satisfaction-global', dashboardStatController.getGlobalSatisfaction);

module.exports = router;
