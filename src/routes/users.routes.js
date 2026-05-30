const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

// Appliquer protect à toutes les routes ci-dessous
router.use(protect);

// Routes utilisateurs
router.post('/', restrictTo('Admin'), checkPermission(MODULES.USERS, 'create'), userController.createUser);        // Créer un utilisateur
router.get('/', checkPermission(MODULES.USERS, 'read'), userController.getAllUsers);        // Récupérer tous les utilisateurs
router.get('/commercials/assignable', checkPermission(MODULES.CLIENTS, 'read'), userController.getAssignableCommercials);
router.get('/commercials/devis-filter', checkPermission(MODULES.DEVIS, 'read'), userController.getAssignableCommercials);
router.get('/commercials/activites-filter', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'read'), userController.getAssignableCommercials);
router.get('/members/calendar-filter', checkPermission([MODULES.ACTIVITES, MODULES.CALENDRIER], 'read'), userController.getCalendarMembers);
router.get('/commercials/objectifs-filter', checkPermission(MODULES.OBJECTIFS, 'read'), userController.getAssignableCommercials);
router.get('/commercials/projets-filter', checkPermission(MODULES.PROJETS, 'read'), userController.getAssignableCommercials);
router.get('/:id', checkPermission(MODULES.USERS, 'read'), userController.getUserById);
router.put('/:id', checkPermission(MODULES.USERS, 'update'), userController.updateUser);
router.post('/:id/resend-credentials', restrictTo('Admin'), checkPermission(MODULES.USERS, 'update'), userController.resendCredentials);
router.delete('/:id', restrictTo('Admin'), checkPermission(MODULES.USERS, 'delete'), userController.deleteUser);

module.exports = router;
