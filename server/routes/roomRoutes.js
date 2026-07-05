const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createRoom, getRooms, joinRoom } = require('../controllers/roomController');

router.post('/create', protect, createRoom);
router.get('/', protect, getRooms);
router.put('/join/:roomId', protect, joinRoom);

module.exports = router;