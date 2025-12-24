const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getStudentHistory,
  getStudentAnalytics,
  getPendingClasses,
  getMissedClasses,
  getClassAttendance,
  updateAttendance,
  getTeacherAnalytics,
  getTeacherStudentsAttendance,
  getTeacherOptions,
  getAttendanceMonths,
} = require('../controllers/attendanceController');

const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { sensitiveLimiter } = require('../middleware/rateLimiter');
const { 
  validate, 
  markAttendanceSchema, 
  updateAttendanceSchema,
  teacherStudentsQuerySchema,
} = require('../middleware/validators');

// ========================
// Student Routes
// ========================
router.post(
  '/mark', 
  verifyToken, 
  verifyRole('student'), 
  sensitiveLimiter,
  validate(markAttendanceSchema),
  markAttendance
);

router.get(
  '/student/history', 
  verifyToken, 
  verifyRole('student'), 
  getStudentHistory
);

router.get(
  '/student/analytics', 
  verifyToken, 
  verifyRole('student'), 
  getStudentAnalytics
);

router.get(
  '/pending', 
  verifyToken, 
  verifyRole('student'), 
  getPendingClasses
);

// NEW: Get missed classes
router.get(
  '/missed',
  verifyToken,
  verifyRole('student'),
  getMissedClasses
);

// ========================
// Teacher Routes
// ========================
router.get(
  '/class/:classId', 
  verifyToken, 
  verifyRole('teacher'), 
  getClassAttendance
);

router.post(
  '/update', 
  verifyToken, 
  verifyRole('teacher'),
  sensitiveLimiter,
  validate(updateAttendanceSchema),
  updateAttendance
);

router.get(
  '/teacher/analytics', 
  verifyToken, 
  verifyRole('teacher'), 
  getTeacherAnalytics
);

router.get(
  '/teacher/students',
  verifyToken,
  verifyRole('teacher'),
  getTeacherStudentsAttendance
);

router.get(
  '/teacher/options',
  verifyToken,
  verifyRole('teacher'),
  getTeacherOptions
);

router.get(
  '/teacher/months',
  verifyToken,
  verifyRole('teacher'),
  getAttendanceMonths
);

module.exports = router;
