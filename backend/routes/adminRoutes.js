const express = require('express');
const router = express.Router();
const { assignTeacher, getSubjects, getTeachers } = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Admin-only routes
// First verify JWT token, then verify admin role
router.post('/assign-teacher', verifyToken, verifyAdmin, assignTeacher);
router.get('/subjects', verifyToken, verifyAdmin, getSubjects);
router.get('/teachers', verifyToken, verifyAdmin, getTeachers);

module.exports = router;
