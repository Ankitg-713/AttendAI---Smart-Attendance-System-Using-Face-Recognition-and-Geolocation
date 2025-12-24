const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// All teacher routes require teacher authentication
router.use(verifyToken, verifyRole('teacher'));

// GET subjects assigned for the teacher
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({ teacher: req.user.id });
    res.json(subjects);
  } catch (err) {
    console.error('Get teacher subjects error:', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

module.exports = router;
