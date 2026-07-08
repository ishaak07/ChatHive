const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { getSmartReplies, summarizeChat, extractInfo } = require('../controllers/aiController');

router.post('/smart-replies', protect, getSmartReplies);
router.post('/summarize', protect, summarizeChat);
router.post('/extract', protect, extractInfo);

module.exports = router;