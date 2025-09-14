const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Add this route to get current logged-in user info
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
