const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { checkPermission, MODULES } = require('../middleware/checkPermissions');

router.use(protect);

// Routes messages
router.get('/', checkPermission(MODULES.MESSAGES, 'read'), messageController.getAllMessages);
router.get('/:id', checkPermission(MODULES.MESSAGES, 'read'), messageController.getMessageById);
router.post('/', checkPermission(MODULES.MESSAGES, 'create'), messageController.createMessage);
router.delete('/:id', checkPermission(MODULES.MESSAGES, 'delete'), messageController.deleteMessage);

module.exports = router;

