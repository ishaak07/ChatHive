const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getRoomMessages, getPrivateMessages, deleteMessage } = require('../controllers/messageController');

router.get('/room/:roomId', protect, getRoomMessages);
router.get('/private/:userId', protect, getPrivateMessages);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;