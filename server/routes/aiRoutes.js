const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getSmartReplies, summarizeChat } = require('../controllers/aiController');

router.post('/smart-replies', protect, getSmartReplies);
router.post('/summarize', protect, summarizeChat);

module.exports = router;