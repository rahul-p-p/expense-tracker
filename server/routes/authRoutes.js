
const express = require('express');

const router = express.Router();

const {
    registerUser,
    loginUser,
    getMe
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Current user (protected)
router.get('/me', protect, getMe);

module.exports = router;
