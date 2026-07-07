const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  searchUser,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
} = require('../controllers/friendController');

router.get('/search', protect, searchUser);
router.post('/request/:userId', protect, sendFriendRequest);
router.get('/requests', protect, getPendingRequests);
router.put('/accept/:requestId', protect, acceptFriendRequest);
router.put('/reject/:requestId', protect, rejectFriendRequest);
router.get('/', protect, getFriends);
router.delete('/:friendId', protect, removeFriend);

module.exports = router;