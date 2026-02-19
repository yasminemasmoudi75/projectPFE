const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// Appliquer protect à toutes les routes ci-dessous
router.use(protect);

// Routes utilisateurs
router.post('/', restrictTo('Admin'), userController.createUser);        // Créer un utilisateur
router.get('/', userController.getAllUsers);        // Récupérer tous les utilisateurs
router.get('/:id', userController.getUserById);     // Récupérer un utilisateur par ID
router.put('/:id', userController.updateUser);      // Mettre à jour un utilisateur
router.delete('/:id', restrictTo('Admin'), userController.deleteUser);   // Supprimer un utilisateur

module.exports = router;

