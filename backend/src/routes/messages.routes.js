const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Routes messages
router.get('/', messageController.getAllMessages);
router.get('/:id', messageController.getMessageById);
router.post('/', messageController.createMessage);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;

