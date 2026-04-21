const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');
const upload = require('../config/uploadMessage');

// Augmenter le timeout pour les uploads volumineux
router.use((req, res, next) => {
  req.setTimeout(120000); // 2 minutes
  next();
});

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

// Télécharger la pièce jointe d'un message
router.get('/:id/attachment', checkPermission(MODULES.MESSAGES, 'read'), messageController.downloadAttachment);

// Envoyer un message
router.post('/send', checkPermission(MODULES.MESSAGES, 'create'), upload.single('attachment'), messageController.sendMessage);

// Marquer comme lu
router.patch('/:id/mark-read', checkPermission(MODULES.MESSAGES, 'read'), messageController.markAsRead);

// Marquer comme non lu
router.patch('/:id/mark-unread', checkPermission(MODULES.MESSAGES, 'read'), messageController.markAsUnread);

// Supprimer un message
router.delete('/:id', checkPermission(MODULES.MESSAGES, 'delete'), messageController.deleteMessage);

// Synchroniser les emails Gmail
router.post('/sync-gmail', checkPermission(MODULES.MESSAGES, 'read'), messageController.syncGmailMessages);

module.exports = router;

