const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getRoomMessages, getPrivateMessages } = require('../controllers/messageController');

router.get('/room/:roomId', protect, getRoomMessages);
router.get('/private/:userId', protect, getPrivateMessages);

module.exports = router;