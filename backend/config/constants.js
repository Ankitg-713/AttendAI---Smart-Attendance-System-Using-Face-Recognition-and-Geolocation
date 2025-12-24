/**
 * Application Constants & Configuration
 * Centralized configuration to avoid magic numbers throughout the codebase
 */

module.exports = {
  // ========================
  // Face Recognition Settings
  // ========================
  FACE_MATCH_THRESHOLD: 0.6, // Euclidean distance threshold (lower = stricter)
  
  // ========================
  // Geolocation Settings
  // ========================
  DEFAULT_ATTENDANCE_RADIUS: 50, // meters - default radius for attendance
  MIN_ATTENDANCE_RADIUS: 10,     // meters - minimum allowed radius
  MAX_ATTENDANCE_RADIUS: 500,    // meters - maximum allowed radius
  
  // ========================
  // Time Settings
  // ========================
  LATE_GRACE_MINUTES: 10,        // minutes after class start to mark as "late"
  END_GRACE_MINUTES: 5,          // minutes after class end to still allow marking
  JWT_EXPIRY: '2h',              // JWT token expiration
  
  // ========================
  // Attendance Settings
  // ========================
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused',
  },
  
  MIN_ATTENDANCE_PERCENTAGE: 75, // Minimum required attendance percentage
  
  // ========================
  // Class Settings
  // ========================
  CLASS_STATUS: {
    SCHEDULED: 'scheduled',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
  
  // ========================
  // Rate Limiting
  // ========================
  RATE_LIMIT: {
    AUTH_WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
    AUTH_MAX_REQUESTS: 100,           // Max login/register attempts per window (increased for dev)
    GENERAL_WINDOW_MS: 1 * 60 * 1000, // 1 minute
    GENERAL_MAX_REQUESTS: 500,        // Max general requests per window (increased for dev)
  },
  
  // ========================
  // Supported Courses & Semesters
  // ========================
  COURSES: ['MCA'],
  SEMESTERS: {
    MCA: [1, 2, 3, 4],
  },
  
  // ========================
  // User Roles
  // ========================
  ROLES: {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
  },
};

