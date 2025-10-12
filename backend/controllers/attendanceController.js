const geolib = require("geolib");
const User = require("../models/User");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");
const { euclideanDistance, FACE_MATCH_THRESHOLD } = require("../utils/faceRecognition");

// ==============================
// @desc    Mark Attendance
// @route   POST /api/attendance/mark
// @access  Student only
// ==============================

exports.markAttendance = async (req, res) => {
  try {
    const { faceDescriptor, latitude, longitude, classId } = req.body;

    if (!faceDescriptor || !latitude || !longitude || !classId) {
      return res.status(400).json({ message: "Incomplete data provided" });
    }

    // ✅ Optimization: Get logged-in student's details first
    const currentStudent = await User.findById(req.user.id).select(
      "course semester role faceDescriptor"
    );
    
    if (!currentStudent || currentStudent.role !== "student") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ Performance: Only fetch students from same course/semester
    const users = await User.find({ 
      role: "student",
      course: currentStudent.course,
      semester: currentStudent.semester
    }).select('faceDescriptor');
    
    let matchedUser = null;

    for (let user of users) {
      const distance = euclideanDistance(faceDescriptor, user.faceDescriptor);
      if (distance < FACE_MATCH_THRESHOLD) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser)
      return res.status(401).json({ message: "Face not recognized" });

    if (matchedUser._id.toString() !== req.user.id)
      return res.status(403).json({ message: "You cannot mark for others" });

    const currentClass = await Class.findById(classId);
    if (!currentClass)
      return res.status(400).json({ message: "Class not found" });

    const isNearby = geolib.isPointWithinRadius(
      { latitude, longitude },
      { latitude: currentClass.latitude, longitude: currentClass.longitude },
      50
    );

    if (!isNearby)
      return res.status(403).json({
        message: "You are not within allowed location range",
      });

    // ✅ Use already fetched currentStudent
    if (
      currentClass.semester !== currentStudent.semester ||
      currentClass.course !== currentStudent.course
    ) {
      return res.status(403).json({
        message: "This class is not available for your semester/course",
      });
    }

    const [startH, startM] = currentClass.startTime.split(":").map(Number);
    const [endH, endM] = currentClass.endTime.split(":").map(Number);

    const start = new Date(currentClass.date);
    start.setHours(startH, startM, 0);

    const end = new Date(currentClass.date);
    end.setHours(endH, endM, 0);

    const now = new Date();
    if (now < start || now > end)
      return res.status(400).json({ message: "Class is not active currently" });

    const alreadyMarked = await Attendance.findOne({
      student: matchedUser._id,
      class: currentClass._id,
    });

    if (alreadyMarked)
      return res
        .status(400)
        .json({ message: "Attendance already marked for this class" });

    const attendance = new Attendance({
      student: matchedUser._id,
      class: currentClass._id,
      status: "present",
    });

    await attendance.save();
    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Student's Attendance History
// @route   GET /api/attendance/student/history
// @access  Student only
// ==============================
exports.getStudentHistory = async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.user.id }).populate(
      "class",
      "subject date startTime endTime"
    );

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Student Analytics
// @route   GET /api/attendance/student/analytics
// @access  Student only
// ==============================
exports.getStudentAnalytics = async (req, res) => {
  try {
    // 1) Fetch the student document
    const student = await User.findById(req.user.id).select(
      "course semester role"
    );
    if (!student || student.role !== "student") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2) Get all classes for that course/semester
    const allClasses = await Class.find({
      course: student.course,
      semester: student.semester,
    }).populate("subject", "name"); // subject.name available now

    // 3) Get student’s attendance records
    const attendanceRecords = await Attendance.find({ student: req.user.id });

    const subjectStats = {};

    // Count total classes per subject
    for (let cls of allClasses) {
      const subjectName = cls.subject?.name || "Unknown";
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = { total: 0, present: 0 };
      }
      subjectStats[subjectName].total += 1;
    }

    // Count present marks
    for (let record of attendanceRecords) {
      const cls = await Class.findById(record.class).populate(
        "subject",
        "name"
      );
      if (cls && record.status === "present") {
        const subjectName = cls.subject?.name || "Unknown";
        if (subjectStats[subjectName]) {
          subjectStats[subjectName].present += 1;
        }
      }
    }

    // 4) Format result
    const result = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      percentage:
        stats.total === 0
          ? 0
          : ((stats.present / stats.total) * 100).toFixed(2),
    }));

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Students in a Class with Attendance
// @route   GET /api/attendance/class/:classId
// @access  Teacher only
// ==============================
exports.getClassAttendance = async (req, res) => {
  try {
    const classId = req.params.classId;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // 1. Get all students of this course + semester
    const students = await User.find({
      role: "student",
      course: cls.course,
      semester: cls.semester,
    }).select("name email");

    // 2. Get existing attendance records
    const attendance = await Attendance.find({ class: classId });

    // 3. Merge students + attendance
    const records = students.map((student) => {
      const record = attendance.find(
        (a) => a.student.toString() === student._id.toString()
      );
      return {
        student,
        status: record
          ? record.status === "present"
            ? "Present"
            : "Absent"
          : "Absent",
      };
    });

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Pending Classes for Student
// @route   GET /api/attendance/pending
// @access  Student only
// ==============================
// controllers/attendanceController.js
exports.getPendingClasses = async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1) Load the student to get course/semester
    const student = await User.findById(studentId).select(
      "role course semester"
    );
    if (!student || student.role !== "student") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2) Build a local-date string (avoids UTC off-by-one issues)
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD

    // 3) Fetch classes for the student's course/semester that are today or later
    const classes = await Class.find({
      course: student.course,
      semester: student.semester,
      date: { $gte: todayStr },
    })
      .sort({ date: 1, startTime: 1 })
      .populate("subject", "name"); // so cls.subject?.name works on the frontend

    // 4) Exclude already-marked
    const attendance = await Attendance.find({ student: studentId }).select(
      "class"
    );
    const attendedClassIds = new Set(attendance.map((a) => a.class.toString()));

    const pending = classes.filter(
      (cls) => !attendedClassIds.has(cls._id.toString())
    );

    return res.status(200).json(pending);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Update Attendance (teacher manually edits)
// @route   POST /api/attendance/update
// @access  Teacher only
// ==============================
exports.updateAttendance = async (req, res) => {
  try {
    const { classId, studentId, present } = req.body;

    if (!classId || !studentId) {
      return res
        .status(400)
        .json({ message: "ClassId and StudentId required" });
    }

    let record = await Attendance.findOne({
      class: classId,
      student: studentId,
    });

    if (record) {
      // update existing record
      record.status = present ? "present" : "absent";
      await record.save();
    } else {
      // create new record if not exists
      record = new Attendance({
        class: classId,
        student: studentId,
        status: present ? "present" : "absent",
      });
      await record.save();
    }

    res.status(200).json({ message: "Attendance updated", record });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Teacher Analytics
// @route   GET /api/attendance/teacher/analytics
// @access  Teacher only
// ==============================
exports.getTeacherAnalytics = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get all classes taught by this teacher
    const classes = await Class.find({ teacher: teacherId }).populate(
      "subject",
      "name"
    );
    if (!classes.length) return res.status(200).json([]);

    // Group classes by subject
    const subjectMap = {};
    classes.forEach((cls) => {
      const subjectName = cls.subject?.name || "Unknown";
      if (!subjectMap[subjectName]) subjectMap[subjectName] = [];
      subjectMap[subjectName].push(cls._id);
    });

    const analytics = [];

    // For each subject, calculate total present and total possible
    for (let [subject, classIds] of Object.entries(subjectMap)) {
      const attendanceRecords = await Attendance.find({
        class: { $in: classIds },
      });

      // Total students in all classes
      const totalStudents = await Attendance.distinct("student", {
        class: { $in: classIds },
      });
      const totalPossible = totalStudents.length * classIds.length; // students × classes

      const totalPresent = attendanceRecords.filter(
        (r) => r.status === "present"
      ).length;

      const percentage =
        totalPossible > 0
          ? Math.round((totalPresent / totalPossible) * 100)
          : 0;

      analytics.push({ subject, percentage });
    }

    res.status(200).json(analytics);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Students Attendance (Monthly or Overall)
// @route   GET /api/attendance/teacher/students
// @access  Teacher only
// ==============================
exports.getTeacherStudentsAttendance = async (req, res) => {
  try {
    const { course, semester, subject, month, year, overall } = req.query;
    const overallFlag = overall === "true"; // convert string to boolean

    if (!course || !semester || !subject) {
      return res
        .status(400)
        .json({ message: "Course, semester, and subject required" });
    }

    // 1) Find all classes for this teacher + course + semester
    let classes = await Class.find({
      teacher: req.user.id,
      course,
      semester,
    }).populate("subject", "name date startTime endTime");

    // 2) Filter by subject
    classes = classes.filter((cls) => cls.subject?.name === subject);

    // 3) Filter by month/year if monthly view (overall = false)
    if (!overallFlag) {
      if (!month || !year)
        return res
          .status(400)
          .json({ message: "Month and year required for monthly view" });

      classes = classes.filter((cls) => {
        const classDate = new Date(cls.date);
        return (
          classDate.getMonth() + 1 === parseInt(month) &&
          classDate.getFullYear() === parseInt(year)
        );
      });
    }

    if (classes.length === 0) return res.status(200).json([]);

    // 4) Get all students for this course/semester
    const students = await User.find({
      role: "student",
      course,
      semester,
    }).select("name email");

    // 5) Build attendance matrix
    const attendanceMatrix = [];

    for (let student of students) {
      let attendance = {};
      let presentCount = 0;

      for (let cls of classes) {
        const record = await Attendance.findOne({
          student: student._id,
          class: cls._id,
        });
        const status = record ? record.status : "absent";

        // Use date + time as key
        const dateTimeKey = `${cls.date} ${cls.startTime}-${cls.endTime}`;
        attendance[dateTimeKey] = status;

        if (status === "present") presentCount++;
      }

      const totalClasses = classes.length;
      const percentage =
        totalClasses === 0
          ? 0
          : ((presentCount / totalClasses) * 100).toFixed(2);

      attendanceMatrix.push({
        student,
        attendance, // keys are "YYYY-MM-DD HH:MM-HH:MM"
        totalClasses,
        presentCount,
        percentage,
      });
    }

    res.status(200).json(attendanceMatrix);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get teacher's courses, semesters, subjects
// @route   GET /api/teacher/options
// @access  Teacher only
// ==============================
exports.getTeacherOptions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const subjects = await Subject.find({ teacher: teacherId });

    const courses = [...new Set(subjects.map((s) => s.course))];
    const semesters = [...new Set(subjects.map((s) => s.semester))];
    const subjectNames = [...new Set(subjects.map((s) => s.name))];

    res.status(200).json({ courses, semesters, subjects: subjectNames });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// GET /api/attendance/teacher/months?course=...&semester=...&subject=...
exports.getAttendanceMonths = async (req, res) => {
  try {
    const { course, semester, subject } = req.query;
    if (!course || !semester || !subject) {
      return res
        .status(400)
        .json({ message: "Course, semester, and subject required" });
    }

    const classes = await Class.find({ course, semester }).populate(
      "subject",
      "name"
    );
    const filteredClasses = classes.filter(
      (cls) => cls.subject?.name === subject
    );

    // Get unique month-year strings like "2025-09"
    const months = Array.from(
      new Set(
        filteredClasses.map((cls) => {
          const d = new Date(cls.date);
          return `${d.getFullYear()}-${(d.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
        })
      )
    );

    res.status(200).json(months);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
