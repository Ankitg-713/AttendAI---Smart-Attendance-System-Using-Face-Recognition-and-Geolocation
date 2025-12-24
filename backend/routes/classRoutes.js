const express = require('express');
const router = express.Router();

const {
  createClass,
  cancelClass,
  updateClass,
  getTeacherClasses,
  getStudentClasses,
  getAllClasses,
  getClassById,
} = require('../controllers/classController');

const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { sensitiveLimiter } = require('../middleware/rateLimiter');
const { validate, createClassSchema, cancelClassSchema } = require('../middleware/validators');

// ========================
// Teacher Routes
// ========================
router.post(
  '/', 
  verifyToken, 
  verifyRole('teacher'),
  sensitiveLimiter,
  validate(createClassSchema),
  createClass
);

router.post(
  '/:classId/cancel',
  verifyToken,
  verifyRole('teacher'),
  sensitiveLimiter,
  cancelClass
);

router.put(
  '/:classId',
  verifyToken,
  verifyRole('teacher'),
  updateClass
);

router.get(
  '/teacher', 
  verifyToken, 
  verifyRole('teacher'), 
  getTeacherClasses
);

// ========================
// Student Route
// ========================
router.get(
  '/student', 
  verifyToken, 
  verifyRole('student'), 
  getStudentClasses
);

// ========================
// Common Routes
// ========================
router.get(
  '/list', 
  verifyToken, 
  getAllClasses
);

router.get(
  '/:classId',
  verifyToken,
  getClassById
);

module.exports = router;
