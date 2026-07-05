const express = require('express');
const router = express.Router();
const { signup, login, getUsers, updateProfile } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/users', protect, getUsers);
router.put('/update-profile', protect, updateProfile);

module.exports = router;