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
router.get('/:id', checkPermission(MODULES.USERS, 'read'), userController.getUserById);     // Récupérer un utilisateur par ID
router.put('/:id', checkPermission(MODULES.USERS, 'update'), userController.updateUser);      // Mettre à jour un utilisateur
router.delete('/:id', restrictTo('Admin'), checkPermission(MODULES.USERS, 'delete'), userController.deleteUser);   // Supprimer un utilisateur

module.exports = router;

