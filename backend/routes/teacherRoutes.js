const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// GET subjects assigned for the teacher
router.get('/subjects', verifyToken, verifyRole('teacher'), async (req, res) => {
  try {
    // Fetch only subjects assigned to this teacher
    const subjects = await Subject.find({ teacher: req.user.id });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

module.exports = router;
