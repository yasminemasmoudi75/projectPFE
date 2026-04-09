const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

/**
 * ═══════════════════════════════════════════════════════════════════════
 * MESSAGE ROUTES - Gmail Integration
 * ═══════════════════════════════════════════════════════════════════════
 */

// Récupérer tous les messages (inbox)
router.get('/', checkPermission(MODULES.MESSAGES, 'read'), messageController.getInbox);

// Obtenir les statistiques
router.get('/stats', checkPermission(MODULES.MESSAGES, 'read'), messageController.getStats);

// Récupérer un message spécifique
router.get('/:id', checkPermission(MODULES.MESSAGES, 'read'), messageController.getMessageById);

// Envoyer un message
router.post('/send', checkPermission(MODULES.MESSAGES, 'create'), messageController.sendMessage);

// Marquer comme lu
router.patch('/:id/mark-read', checkPermission(MODULES.MESSAGES, 'read'), messageController.markAsRead);

// Marquer comme non lu
router.patch('/:id/mark-unread', checkPermission(MODULES.MESSAGES, 'read'), messageController.markAsUnread);

// Supprimer un message
router.delete('/:id', checkPermission(MODULES.MESSAGES, 'delete'), messageController.deleteMessage);

// Synchroniser les emails Gmail
router.post('/sync-gmail', checkPermission(MODULES.MESSAGES, 'read'), messageController.syncGmailMessages);

module.exports = router;

