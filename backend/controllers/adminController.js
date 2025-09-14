const Subject = require('../models/Subject');
const User = require('../models/User');

// Assign a teacher to a subject
exports.assignTeacher = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.body;

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher ID' });
    }

    const subject = await Subject.findByIdAndUpdate(
      subjectId,
      { teacher: teacherId },
      { new: true }
    );

    res.status(200).json({ message: 'Teacher assigned successfully', subject });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Get all subjects with assigned teachers
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().populate('teacher', 'name email');
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password -faceDescriptor');
    res.json(teachers);
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
};