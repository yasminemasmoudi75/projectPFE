const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getContacts,
  getContactsByTier,
  createContact,
  updateContact,
  deleteContact
} = require('../controllers/contactController');

// Récupérer tous les contacts
router.get('/', protect, getContacts);

// Récupérer les contacts d'un client
router.get('/tier/:tierId', protect, getContactsByTier);

// Créer un contact
router.post('/', protect, createContact);

// Modifier un contact
router.put('/:tierId/:contactId', protect, updateContact);

// Supprimer un contact
router.delete('/:tierId/:contactId', protect, deleteContact);

module.exports = router;
