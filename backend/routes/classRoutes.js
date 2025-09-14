const express = require('express');
const router = express.Router();

const {
  createClass,
  getTeacherClasses,
  getStudentClasses,
  getAllClasses,
} = require('../controllers/classController');

const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Teacher routes
router.post('/', verifyToken, verifyRole('teacher'), createClass);
router.get('/teacher', verifyToken, verifyRole('teacher'), getTeacherClasses);

// Student route
router.get('/student', verifyToken, verifyRole('student'), getStudentClasses);

// Common route
router.get('/list', verifyToken, getAllClasses);

module.exports = router;
