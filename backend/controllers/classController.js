const Class = require('../models/Class');
const Subject = require('../models/Subject');

// ==============================
// @desc    Create a new class (Teacher schedules)
// @route   POST /api/classes
// @access  Teacher only
// ==============================
exports.createClass = async (req, res) => {
  try {
    const { subject: subjectId, date, startTime, endTime } = req.body;

    if (!subjectId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Fetch subject and check assignment
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    if (subject.teacher.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'You are not assigned to this subject' });
    }

    const newClass = new Class({
      subject: subject._id,
      teacher: req.user.id,
      date,
      startTime,
      endTime,
      semester: subject.semester,
      course: subject.course,
    });

    await newClass.save();

    res
      .status(201)
      .json({ message: 'Class scheduled successfully', class: newClass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// @desc    Get all classes for a teacher
// @route   GET /api/classes/teacher
// @access  Teacher only
// ==============================
exports.getTeacherClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user.id }).sort({ date: 1 }).populate('subject', 'name semester course');
    res.status(200).json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==============================
// @desc    Get all classes for a student
// @route   GET /api/classes/student
// @access  Student only
// ==============================
exports.getStudentClasses = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);

    if (!student || student.role !== "student") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const classes = await Class.find({
      course: student.course,
      semester: student.semester,
    })
      .sort({ date: 1 })
      .populate("subject", "name");

    res.status(200).json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// ==============================
// @desc    Get All Classes (Admin/Teacher view)
// ==============================
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('teacher', 'name email').populate('subject', 'name semester course');
    res.status(200).json({ classes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching classes' });
  }
};
