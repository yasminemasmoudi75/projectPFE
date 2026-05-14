const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const loginLogController = require('../controllers/loginLogController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../config/multer');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

// Routes protégées
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, upload.single('profilePicture'), authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);

// Journal des connexions (admin uniquement)
router.get('/logs', protect, restrictTo('Admin'), loginLogController.getLogs);
router.get('/trace', protect, restrictTo('Admin'), loginLogController.getTraceLogs);
router.delete('/logs/clear', protect, restrictTo('Admin'), loginLogController.clearOldLogs);

module.exports = router;
