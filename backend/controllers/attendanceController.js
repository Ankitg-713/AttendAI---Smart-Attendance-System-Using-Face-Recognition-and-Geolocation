const geolib = require("geolib");
const User = require("../models/User");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");
const Subject = require("../models/Subject");
const { euclideanDistance, findBestMatch, FACE_MATCH_THRESHOLD } = require("../utils/faceRecognition");
const { 
  ATTENDANCE_STATUS, 
  CLASS_STATUS,
  MIN_ATTENDANCE_PERCENTAGE,
  LATE_GRACE_MINUTES,
  END_GRACE_MINUTES,
} = require("../config/constants");

// ==============================
// @desc    Mark Attendance
// @route   POST /api/attendance/mark
// @access  Student only
// ==============================
exports.markAttendance = async (req, res) => {
  try {
    const { faceDescriptor, latitude, longitude, classId } = req.body;

    // Get logged-in student's details
    const currentStudent = await User.findById(req.user.id).select(
      "course semester role faceDescriptor enrollmentDate isActive"
    );
    
    if (!currentStudent || currentStudent.role !== "student") {
      return res.status(403).json({ message: "Only students can mark attendance" });
    }

    if (!currentStudent.isActive) {
      return res.status(403).json({ message: "Your account is deactivated" });
    }

    // Get the class
    const currentClass = await Class.findById(classId);
    if (!currentClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if class is cancelled
    if (currentClass.status === CLASS_STATUS.CANCELLED) {
      return res.status(400).json({ message: "This class has been cancelled" });
    }

    // Verify course/semester match
    if (
      currentClass.semester !== currentStudent.semester ||
      currentClass.course !== currentStudent.course
    ) {
      return res.status(403).json({
        message: "This class is not available for your semester/course",
      });
    }

    // Check time constraints with configurable grace period
    const [startH, startM] = currentClass.startTime.split(":").map(Number);
    const [endH, endM] = currentClass.endTime.split(":").map(Number);

    const classDate = new Date(currentClass.date);
    const start = new Date(classDate);
    start.setHours(startH, startM, 0, 0);

    const end = new Date(classDate);
    end.setHours(endH, endM, 0, 0);
    
    // Add grace period to end time
    const endWithGrace = new Date(end);
    endWithGrace.setMinutes(endWithGrace.getMinutes() + (currentClass.endGraceMinutes || END_GRACE_MINUTES));

    const now = new Date();
    
    if (now < start) {
      return res.status(400).json({ message: "Class has not started yet" });
    }
    
    if (now > endWithGrace) {
      return res.status(400).json({ message: "Attendance window has closed for this class" });
    }

    // Check GPS location with configurable radius
    const attendanceRadius = currentClass.attendanceRadius || 50;
    const isNearby = geolib.isPointWithinRadius(
      { latitude, longitude },
      { latitude: currentClass.latitude, longitude: currentClass.longitude },
      attendanceRadius
    );

    if (!isNearby) {
      const distance = geolib.getDistance(
        { latitude, longitude },
        { latitude: currentClass.latitude, longitude: currentClass.longitude }
      );
      return res.status(403).json({
        message: `You are ${distance}m away. Must be within ${attendanceRadius}m of the class location.`,
      });
    }

    // Face recognition - only search students in same course/semester for efficiency
    const studentsInClass = await User.find({ 
      role: "student",
      course: currentStudent.course,
      semester: currentStudent.semester,
      isActive: true,
    }).select('_id faceDescriptor');
    
    const matchResult = findBestMatch(faceDescriptor, studentsInClass);

    if (!matchResult) {
      return res.status(401).json({ message: "Face not recognized. Please try again with better lighting." });
    }

    // Verify the matched face belongs to the logged-in user
    if (matchResult.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Face does not match your profile. You cannot mark attendance for others." });
    }

    // Check for duplicate attendance
    const alreadyMarked = await Attendance.findOne({
      student: req.user.id,
      class: currentClass._id,
    });

    if (alreadyMarked) {
      return res.status(400).json({ message: "You have already marked attendance for this class" });
    }

    // Determine if attendance is late
    const lateGrace = currentClass.lateGraceMinutes || LATE_GRACE_MINUTES;
    const lateThreshold = new Date(start);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + lateGrace);
    
    const status = now > lateThreshold ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT;

    // Create attendance record with audit trail
    const attendance = new Attendance({
      student: req.user.id,
      class: currentClass._id,
      status,
      markedBy: null, // null indicates self-marked
      markedAt: now,
      locationSnapshot: {
        latitude,
        longitude,
      },
      faceMatchDistance: matchResult.distance,
    });

    await attendance.save();

    // Update class status if it's the first attendance
    if (currentClass.status === CLASS_STATUS.SCHEDULED) {
      currentClass.status = CLASS_STATUS.ONGOING;
      await currentClass.save();
    }

    const statusMessage = status === ATTENDANCE_STATUS.LATE 
      ? "Attendance marked as LATE" 
      : "Attendance marked successfully";

    res.status(200).json({ 
      message: statusMessage,
      status,
      markedAt: now,
    });
  } catch (err) {
    console.error("Mark attendance error:", err);
    res.status(500).json({ message: "Server error while marking attendance" });
  }
};

// ==============================
// @desc    Get Student Analytics (with enrollment date fix)
// @route   GET /api/attendance/student/analytics
// @access  Student only
// ==============================
exports.getStudentAnalytics = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).select(
      "course semester role enrollmentDate createdAt"
    );
    
    if (!student || student.role !== "student") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Use enrollmentDate or createdAt as fallback
    const enrollmentDate = student.enrollmentDate || student.createdAt;
    const enrollmentDateStr = enrollmentDate.toISOString().slice(0, 10);

    // Only count classes AFTER student enrolled (FIX for mid-semester registration)
    const allClasses = await Class.find({
      course: student.course,
      semester: student.semester,
      date: { $gte: enrollmentDateStr },
      status: { $ne: CLASS_STATUS.CANCELLED }, // Exclude cancelled classes
    }).populate("subject", "name");

    // Get student's attendance records (only for valid classes)
    const classIds = allClasses.map(c => c._id);
    const attendanceRecords = await Attendance.find({ 
      student: req.user.id,
      class: { $in: classIds },
    });

    // Build subject statistics
    const subjectStats = {};

    for (const cls of allClasses) {
      const subjectName = cls.subject?.name || "Unknown";
      if (!subjectStats[subjectName]) {
        subjectStats[subjectName] = { total: 0, present: 0, late: 0, absent: 0 };
      }
      subjectStats[subjectName].total += 1;
    }

    // Count attendance by status
    for (const record of attendanceRecords) {
      const cls = allClasses.find(c => c._id.toString() === record.class.toString());
      if (!cls) continue;
      
      const subjectName = cls.subject?.name || "Unknown";
      if (!subjectStats[subjectName]) continue;

      if (record.status === ATTENDANCE_STATUS.PRESENT) {
        subjectStats[subjectName].present += 1;
      } else if (record.status === ATTENDANCE_STATUS.LATE) {
        subjectStats[subjectName].late += 1;
      }
    }

    // Calculate absent count and percentage
    const result = Object.entries(subjectStats).map(([subject, stats]) => {
      stats.absent = stats.total - stats.present - stats.late;
      // Late counts as present for percentage calculation
      const effectivePresent = stats.present + stats.late;
      const percentage = stats.total === 0 ? 0 : ((effectivePresent / stats.total) * 100);
      
      return {
        subject,
        total: stats.total,
        present: stats.present,
        late: stats.late,
        absent: stats.absent,
        percentage: percentage.toFixed(2),
        status: percentage >= MIN_ATTENDANCE_PERCENTAGE ? "eligible" : "shortage",
        classesNeeded: percentage < MIN_ATTENDANCE_PERCENTAGE 
          ? Math.ceil((MIN_ATTENDANCE_PERCENTAGE * stats.total / 100 - effectivePresent) / (1 - MIN_ATTENDANCE_PERCENTAGE / 100))
          : 0,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Student analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Pending Classes for Student
// @route   GET /api/attendance/pending
// @access  Student only
// ==============================
exports.getPendingClasses = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await User.findById(studentId).select(
      "role course semester enrollmentDate createdAt"
    );
    if (!student || student.role !== "student") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Build today's date string
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString()
      .slice(0, 10);

    // Fetch classes for the student's course/semester that are today or later
    // Exclude cancelled classes
    const classes = await Class.find({
      course: student.course,
      semester: student.semester,
      date: { $gte: todayStr },
      status: { $ne: CLASS_STATUS.CANCELLED },
    })
      .sort({ date: 1, startTime: 1 })
      .populate("subject", "name");

    // Exclude already-marked
    const attendance = await Attendance.find({ student: studentId }).select("class");
    const attendedClassIds = new Set(attendance.map((a) => a.class.toString()));

    const pending = classes.filter(
      (cls) => !attendedClassIds.has(cls._id.toString())
    );

    return res.status(200).json(pending);
  } catch (err) {
    console.error("Pending classes error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Missed Classes for Student (NEW)
// @route   GET /api/attendance/missed
// @access  Student only
// ==============================
exports.getMissedClasses = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await User.findById(studentId).select(
      "role course semester enrollmentDate createdAt"
    );
    if (!student || student.role !== "student") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const enrollmentDate = student.enrollmentDate || student.createdAt;
    const enrollmentDateStr = enrollmentDate.toISOString().slice(0, 10);

    // Get today's date
    const now = new Date();
    const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString()
      .slice(0, 10);

    // Fetch past classes (before today) after enrollment
    const pastClasses = await Class.find({
      course: student.course,
      semester: student.semester,
      date: { $gte: enrollmentDateStr, $lt: todayStr },
      status: { $ne: CLASS_STATUS.CANCELLED },
    })
      .sort({ date: -1 })
      .populate("subject", "name");

    // Get attendance records
    const attendance = await Attendance.find({ student: studentId }).select("class status");
    const attendanceMap = new Map(attendance.map(a => [a.class.toString(), a.status]));

    // Find missed classes
    const missed = pastClasses.filter(cls => {
      const status = attendanceMap.get(cls._id.toString());
      return !status || status === ATTENDANCE_STATUS.ABSENT;
    }).map(cls => ({
      ...cls.toObject(),
      wasAbsent: attendanceMap.has(cls._id.toString()),
    }));

    return res.status(200).json(missed);
  } catch (err) {
    console.error("Missed classes error:", err);
    return res.status(500).json({ message: "Server error" });
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
    
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Verify teacher owns this class
    if (cls.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only view attendance for your own classes" });
    }

    // Get students enrolled BEFORE or ON this class date (FIX for mid-semester registration)
    const classDate = new Date(cls.date);
    classDate.setHours(23, 59, 59, 999); // End of class day

    const students = await User.find({
      role: "student",
      course: cls.course,
      semester: cls.semester,
      isActive: true,
      $or: [
        { enrollmentDate: { $lte: classDate } },
        { createdAt: { $lte: classDate } }, // Fallback for users without enrollmentDate
      ],
    }).select("name email enrollmentDate createdAt");

    // Get existing attendance records
    const attendance = await Attendance.find({ class: classId });

    // Merge students + attendance
    const records = students.map((student) => {
      const record = attendance.find(
        (a) => a.student.toString() === student._id.toString()
      );
      
      const enrolledAt = student.enrollmentDate || student.createdAt;
      const wasEnrolledBeforeClass = new Date(enrolledAt) <= classDate;
      
      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
        },
        status: record?.status || ATTENDANCE_STATUS.ABSENT,
        markedAt: record?.markedAt || null,
        wasEnrolledBeforeClass,
      };
    });

    res.status(200).json(records);
  } catch (err) {
    console.error("Get class attendance error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Update Attendance (teacher manually edits)
// @route   POST /api/attendance/update
// @access  Teacher only
// ==============================
exports.updateAttendance = async (req, res) => {
  try {
    const { classId, studentId, present, reason } = req.body;

    // Get the class and verify teacher ownership
    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    // SECURITY: Verify teacher owns this class
    if (cls.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only edit attendance for your own classes" });
    }

    // Don't allow editing cancelled classes
    if (cls.status === CLASS_STATUS.CANCELLED) {
      return res.status(400).json({ message: "Cannot edit attendance for cancelled classes" });
    }

    // Verify student exists and is in this course/semester
    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.course !== cls.course || student.semester !== cls.semester) {
      return res.status(400).json({ message: "Student is not enrolled in this class" });
    }

    // Check if student was enrolled before this class
    const enrollmentDate = student.enrollmentDate || student.createdAt;
    const classDate = new Date(cls.date);
    if (new Date(enrollmentDate) > classDate) {
      return res.status(400).json({ 
        message: "Student was not enrolled when this class took place" 
      });
    }

    let record = await Attendance.findOne({
      class: classId,
      student: studentId,
    });

    const newStatus = present ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.ABSENT;

    if (record) {
      // Update existing record with audit trail
      record.status = newStatus;
      record.lastModifiedBy = req.user.id;
      record.lastModifiedAt = new Date();
      record.modificationReason = reason || "Teacher manual update";
      await record.save();
    } else {
      // Create new record with audit trail
      record = new Attendance({
        class: classId,
        student: studentId,
        status: newStatus,
        markedBy: req.user.id, // Teacher who marked it
        markedAt: new Date(),
        modificationReason: reason || "Teacher manual entry",
      });
      await record.save();
    }

    res.status(200).json({ 
      message: "Attendance updated successfully", 
      record: {
        status: record.status,
        modifiedAt: record.lastModifiedAt || record.markedAt,
      },
    });
  } catch (err) {
    console.error("Update attendance error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Teacher Analytics (fixed calculation)
// @route   GET /api/attendance/teacher/analytics
// @access  Teacher only
// ==============================
exports.getTeacherAnalytics = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get all non-cancelled classes taught by this teacher
    const classes = await Class.find({ 
      teacher: teacherId,
      status: { $ne: CLASS_STATUS.CANCELLED },
    }).populate("subject", "name");
    
    if (!classes.length) return res.status(200).json([]);

    // Group classes by subject
    const subjectMap = {};
    classes.forEach((cls) => {
      const subjectName = cls.subject?.name || "Unknown";
      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = {
          classIds: [],
          classes: [],
        };
      }
      subjectMap[subjectName].classIds.push(cls._id);
      subjectMap[subjectName].classes.push(cls);
    });

    const analytics = [];

    for (const [subject, data] of Object.entries(subjectMap)) {
      const { classIds, classes: subjectClasses } = data;
      
      // Get unique course/semester combinations for this subject
      const courseSemesters = [...new Set(subjectClasses.map(c => `${c.course}-${c.semester}`))];
      
      let totalPossible = 0;
      let totalPresent = 0;
      let totalLate = 0;

      for (const cs of courseSemesters) {
        const [course, semester] = cs.split('-');
        const semesterNum = parseInt(semester);
        
        // Get ALL students in this course/semester (not just those with records)
        const studentCount = await User.countDocuments({
          role: "student",
          course,
          semester: semesterNum,
          isActive: true,
        });

        // Get classes for this course/semester
        const csClasses = subjectClasses.filter(
          c => c.course === course && c.semester === semesterNum
        );
        
        totalPossible += studentCount * csClasses.length;
      }

      // Count actual attendance
      const attendanceRecords = await Attendance.find({
        class: { $in: classIds },
      });

      totalPresent = attendanceRecords.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
      totalLate = attendanceRecords.filter(r => r.status === ATTENDANCE_STATUS.LATE).length;

      const effectivePresent = totalPresent + totalLate;
      const percentage = totalPossible > 0
        ? Math.round((effectivePresent / totalPossible) * 100)
        : 0;

      analytics.push({ 
        subject, 
        percentage,
        totalClasses: classIds.length,
        totalPresent,
        totalLate,
        totalPossible,
      });
    }

    res.status(200).json(analytics);
  } catch (err) {
    console.error("Teacher analytics error:", err);
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
    const overallFlag = overall === "true";

    // Find all non-cancelled classes for this teacher + course + semester
    let classes = await Class.find({
      teacher: req.user.id,
      course,
      semester: parseInt(semester),
      status: { $ne: CLASS_STATUS.CANCELLED },
    }).populate("subject", "name");

    // Filter by subject
    classes = classes.filter((cls) => cls.subject?.name === subject);

    // Filter by month/year if monthly view
    if (!overallFlag) {
      if (!month || !year) {
        return res.status(400).json({ message: "Month and year required for monthly view" });
      }

      classes = classes.filter((cls) => {
        const classDate = new Date(cls.date);
        return (
          classDate.getMonth() + 1 === parseInt(month) &&
          classDate.getFullYear() === parseInt(year)
        );
      });
    }

    if (classes.length === 0) return res.status(200).json([]);

    // Get all students for this course/semester
    const students = await User.find({
      role: "student",
      course,
      semester: parseInt(semester),
      isActive: true,
    }).select("name email enrollmentDate createdAt");

    // Get all attendance records for these classes in one query (FIX N+1)
    const classIds = classes.map(c => c._id);
    const allAttendance = await Attendance.find({
      class: { $in: classIds },
    });

    // Build attendance matrix
    const attendanceMatrix = students.map(student => {
      const enrollmentDate = student.enrollmentDate || student.createdAt;
      let attendance = {};
      let presentCount = 0;
      let lateCount = 0;
      let eligibleClasses = 0;

      for (const cls of classes) {
        const classDate = new Date(cls.date);
        const wasEnrolled = new Date(enrollmentDate) <= classDate;
        
        if (!wasEnrolled) {
          // Student wasn't enrolled yet - mark as N/A
          const dateTimeKey = `${cls.date} ${cls.startTime}-${cls.endTime}`;
          attendance[dateTimeKey] = "not_enrolled";
          continue;
        }

        eligibleClasses++;
        
        const record = allAttendance.find(
          a => a.student.toString() === student._id.toString() && 
               a.class.toString() === cls._id.toString()
        );
        
        const status = record?.status || ATTENDANCE_STATUS.ABSENT;
        const dateTimeKey = `${cls.date} ${cls.startTime}-${cls.endTime}`;
        attendance[dateTimeKey] = status;

        if (status === ATTENDANCE_STATUS.PRESENT) presentCount++;
        if (status === ATTENDANCE_STATUS.LATE) lateCount++;
      }

      const effectivePresent = presentCount + lateCount;
      const percentage = eligibleClasses === 0
        ? 0
        : ((effectivePresent / eligibleClasses) * 100).toFixed(2);

      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
        },
        attendance,
        totalClasses: classes.length,
        eligibleClasses,
        presentCount,
        lateCount,
        percentage,
        status: parseFloat(percentage) >= MIN_ATTENDANCE_PERCENTAGE ? "eligible" : "shortage",
      };
    });

    res.status(200).json(attendanceMatrix);
  } catch (err) {
    console.error("Teacher students attendance error:", err);
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
    const attendance = await Attendance.find({ student: req.user.id })
      .populate({
        path: "class",
        populate: { path: "subject", select: "name" },
        select: "subject date startTime endTime status",
      })
      .sort({ markedAt: -1 });

    res.status(200).json(attendance);
  } catch (err) {
    console.error("Student history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get teacher's courses, semesters, subjects
// @route   GET /api/attendance/teacher/options
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
    console.error("Teacher options error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==============================
// @desc    Get Available Months for Attendance
// @route   GET /api/attendance/teacher/months
// @access  Teacher only
// ==============================
exports.getAttendanceMonths = async (req, res) => {
  try {
    const { course, semester, subject } = req.query;
    
    const classes = await Class.find({ 
      course, 
      semester: parseInt(semester),
      status: { $ne: CLASS_STATUS.CANCELLED },
    }).populate("subject", "name");
    
    const filteredClasses = classes.filter(
      (cls) => cls.subject?.name === subject
    );

    const months = Array.from(
      new Set(
        filteredClasses.map((cls) => {
          const d = new Date(cls.date);
          return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        })
      )
    ).sort();

    res.status(200).json(months);
  } catch (err) {
    console.error("Attendance months error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
