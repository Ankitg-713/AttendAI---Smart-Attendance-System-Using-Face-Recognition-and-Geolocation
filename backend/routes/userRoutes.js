// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getTeachers } = require('../controllers/userController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Fetch all teachers
router.get('/teachers', verifyAdmin, getTeachers);

module.exports = router;
