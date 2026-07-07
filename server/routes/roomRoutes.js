const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createRoom, getRooms, joinRoom, leaveRoom, deleteRoom } = require('../controllers/roomController');

router.post('/create', protect, createRoom);
router.get('/', protect, getRooms);
router.put('/join/:roomId', protect, joinRoom);
router.put('/leave/:roomId', protect, leaveRoom);
router.delete('/:roomId', protect, deleteRoom);

module.exports = router;