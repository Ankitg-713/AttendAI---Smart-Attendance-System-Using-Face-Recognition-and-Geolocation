const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getStudentHistory,
  getStudentAnalytics,
  getPendingClasses,
  getClassAttendance,
  updateAttendance,
  getTeacherAnalytics,
  getTeacherStudentsAttendance,
  getTeacherOptions,
  getAttendanceMonths,
} = require('../controllers/attendanceController');

const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Student routes
router.post('/mark', verifyToken, verifyRole('student'), markAttendance);
router.get('/student/history', verifyToken, verifyRole('student'), getStudentHistory);
router.get('/student/analytics', verifyToken, verifyRole('student'), getStudentAnalytics);
router.get('/pending', verifyToken, verifyRole('student'), getPendingClasses);

// Teacher route
router.get('/class/:classId', verifyToken, verifyRole('teacher'), getClassAttendance);
router.post('/update', verifyToken, verifyRole('teacher'), updateAttendance);
router.get('/teacher/analytics', verifyToken, verifyRole('teacher'), getTeacherAnalytics);
router.get(
  "/teacher/students",
  verifyToken,
  verifyRole("teacher"),
  getTeacherStudentsAttendance
);
router.get(
  "/teacher/options",
  verifyToken,
  verifyRole("teacher"),
  getTeacherOptions
);
router.get(
  '/teacher/months',
  verifyToken,
  verifyRole('teacher'),
  getAttendanceMonths
);



module.exports = router;
