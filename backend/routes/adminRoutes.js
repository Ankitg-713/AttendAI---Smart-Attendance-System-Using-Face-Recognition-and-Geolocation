const express = require('express');
const router = express.Router();
const { assignTeacher, getSubjects, getTeachers } = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { sensitiveLimiter } = require('../middleware/rateLimiter');
const { validate, assignTeacherSchema } = require('../middleware/validators');

// All admin routes require admin authentication
router.use(verifyToken, verifyAdmin);

// Get all subjects with assigned teachers
router.get('/subjects', getSubjects);

// Get all teachers
router.get('/teachers', getTeachers);

// Assign a teacher to a subject
router.post(
  '/assign-teacher',
  sensitiveLimiter,
  validate(assignTeacherSchema),
  assignTeacher
);

module.exports = router;
