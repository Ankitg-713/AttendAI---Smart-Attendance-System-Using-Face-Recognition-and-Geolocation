const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(ATTENDANCE_STATUS),
    required: true,
  },
  // NEW: Audit trail - who marked this attendance
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null means marked by student themselves
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
  // NEW: Modification tracking
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  lastModifiedAt: {
    type: Date,
    default: null,
  },
  modificationReason: {
    type: String,
    maxlength: 500,
    default: null,
  },
  // NEW: Store location for audit purposes
  locationSnapshot: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    accuracy: { type: Number, default: null }, // GPS accuracy in meters
  },
  // NEW: Face matching confidence (0-1, lower is better match)
  faceMatchDistance: {
    type: Number,
    default: null,
  },
  // Legacy field for backwards compatibility
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { 
  timestamps: true,
});

// Indexes for performance
attendanceSchema.index({ student: 1, class: 1 }, { unique: true });
attendanceSchema.index({ class: 1 });
attendanceSchema.index({ student: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ markedAt: 1 });

// Method to check if attendance can be modified
attendanceSchema.methods.canBeModifiedBy = function(userId, userRole) {
  // Admins can always modify
  if (userRole === 'admin') return true;
  
  // Teachers can modify their own class attendance
  // (need to check class ownership separately)
  if (userRole === 'teacher') return true;
  
  // Students cannot modify attendance
  return false;
};

module.exports = mongoose.model('Attendance', attendanceSchema);
