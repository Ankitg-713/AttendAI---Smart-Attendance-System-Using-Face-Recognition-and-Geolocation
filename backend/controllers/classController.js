const Class = require('../models/Class');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { CLASS_STATUS, ATTENDANCE_STATUS } = require('../config/constants');

// ==============================
// @desc    Create a new class (Teacher schedules)
// @route   POST /api/classes
// @access  Teacher only
// ==============================
exports.createClass = async (req, res) => {
  try {
    const { subject: subjectId, date, startTime, endTime, latitude, longitude } = req.body;

    // Fetch subject and check assignment
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Verify teacher is assigned to this subject
    if (subject.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not assigned to this subject' });
    }

    // Validate time (end time must be after start time)
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check for overlapping classes (PREVENT DOUBLE BOOKING)
    const existingClasses = await Class.find({
      teacher: req.user.id,
      date,
      status: { $ne: CLASS_STATUS.CANCELLED },
    });

    for (const existing of existingClasses) {
      const [existStartH, existStartM] = existing.startTime.split(':').map(Number);
      const [existEndH, existEndM] = existing.endTime.split(':').map(Number);
      const existStartMinutes = existStartH * 60 + existStartM;
      const existEndMinutes = existEndH * 60 + existEndM;

      // Check for overlap
      const hasOverlap = (startMinutes < existEndMinutes) && (endMinutes > existStartMinutes);
      
      if (hasOverlap) {
        return res.status(400).json({ 
          message: `You already have a class scheduled from ${existing.startTime} to ${existing.endTime} on this date`,
        });
      }
    }

    // Check for same subject same time (prevent duplicate class)
    const duplicateClass = await Class.findOne({
      subject: subjectId,
      date,
      startTime,
      status: { $ne: CLASS_STATUS.CANCELLED },
    });

    if (duplicateClass) {
      return res.status(400).json({ 
        message: 'A class for this subject at this time already exists',
      });
    }

    // Don't allow scheduling classes in the past
    const classDateTime = new Date(date);
    classDateTime.setHours(startH, startM, 0, 0);
    
    if (classDateTime < new Date()) {
      return res.status(400).json({ message: 'Cannot schedule classes in the past' });
    }

    // Create new class
    const newClass = new Class({
      subject: subject._id,
      teacher: req.user.id,
      date,
      startTime,
      endTime,
      semester: subject.semester,
      course: subject.course,
      latitude,
      longitude,
      status: CLASS_STATUS.SCHEDULED,
    });

    await newClass.save();

    // Populate subject for response
    await newClass.populate('subject', 'name semester course');

    res.status(201).json({ 
      message: 'Class scheduled successfully', 
      class: newClass,
    });
  } catch (err) {
    console.error('Create class error:', err);
    res.status(500).json({ message: 'Server error while creating class' });
  }
};

// ==============================
// @desc    Cancel a class (NEW)
// @route   POST /api/classes/:classId/cancel
// @access  Teacher only
// ==============================
exports.cancelClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { reason } = req.body;

    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify teacher owns this class
    if (cls.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own classes' });
    }

    // Check if class can be cancelled
    if (cls.status === CLASS_STATUS.CANCELLED) {
      return res.status(400).json({ message: 'Class is already cancelled' });
    }

    if (cls.status === CLASS_STATUS.COMPLETED) {
      return res.status(400).json({ message: 'Cannot cancel a completed class' });
    }

    // Update class status
    cls.status = CLASS_STATUS.CANCELLED;
    cls.cancellationReason = reason;
    cls.cancelledAt = new Date();
    cls.cancelledBy = req.user.id;
    await cls.save();

    // Mark all existing attendance records as "excused" for this class
    await Attendance.updateMany(
      { class: classId },
      { 
        $set: { 
          status: ATTENDANCE_STATUS.EXCUSED,
          lastModifiedBy: req.user.id,
          lastModifiedAt: new Date(),
          modificationReason: `Class cancelled: ${reason}`,
        },
      }
    );

    res.status(200).json({ 
      message: 'Class cancelled successfully',
      class: cls,
    });
  } catch (err) {
    console.error('Cancel class error:', err);
    res.status(500).json({ message: 'Server error while cancelling class' });
  }
};

// ==============================
// @desc    Update class details
// @route   PUT /api/classes/:classId
// @access  Teacher only
// ==============================
exports.updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startTime, endTime, latitude, longitude, attendanceRadius, lateGraceMinutes, endGraceMinutes } = req.body;

    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify teacher owns this class
    if (cls.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own classes' });
    }

    // Can't update cancelled or completed classes
    if (cls.status === CLASS_STATUS.CANCELLED) {
      return res.status(400).json({ message: 'Cannot update a cancelled class' });
    }

    // Update allowed fields
    if (startTime) cls.startTime = startTime;
    if (endTime) cls.endTime = endTime;
    if (latitude !== undefined) cls.latitude = latitude;
    if (longitude !== undefined) cls.longitude = longitude;
    if (attendanceRadius !== undefined) cls.attendanceRadius = attendanceRadius;
    if (lateGraceMinutes !== undefined) cls.lateGraceMinutes = lateGraceMinutes;
    if (endGraceMinutes !== undefined) cls.endGraceMinutes = endGraceMinutes;

    await cls.save();

    res.status(200).json({ 
      message: 'Class updated successfully', 
      class: cls,
    });
  } catch (err) {
    console.error('Update class error:', err);
    res.status(500).json({ message: 'Server error while updating class' });
  }
};

// ==============================
// @desc    Get all classes for a teacher
// @route   GET /api/classes/teacher
// @access  Teacher only
// ==============================
exports.getTeacherClasses = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const query = { teacher: req.user.id };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const classes = await Class.find(query)
      .sort({ date: -1, startTime: -1 })
      .populate('subject', 'name semester course');
    
    res.status(200).json(classes);
  } catch (err) {
    console.error('Get teacher classes error:', err);
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
      status: { $ne: CLASS_STATUS.CANCELLED }, // Exclude cancelled
    })
      .sort({ date: 1, startTime: 1 })
      .populate("subject", "name");

    res.status(200).json(classes);
  } catch (err) {
    console.error('Get student classes error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get All Classes (Admin/Teacher view)
// @route   GET /api/classes/list
// @access  Protected
// ==============================
exports.getAllClasses = async (req, res) => {
  try {
    const { status, course, semester, startDate, endDate } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (course) query.course = course;
    if (semester) query.semester = parseInt(semester);
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const classes = await Class.find(query)
      .populate('teacher', 'name email')
      .populate('subject', 'name semester course')
      .sort({ date: -1, startTime: -1 });
    
    res.status(200).json({ classes });
  } catch (err) {
    console.error('Get all classes error:', err);
    res.status(500).json({ message: 'Error fetching classes' });
  }
};

// ==============================
// @desc    Get Single Class Details
// @route   GET /api/classes/:classId
// @access  Protected
// ==============================
exports.getClassById = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const cls = await Class.findById(classId)
      .populate('teacher', 'name email')
      .populate('subject', 'name semester course');

    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(200).json(cls);
  } catch (err) {
    console.error('Get class by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
