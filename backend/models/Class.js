const mongoose = require('mongoose');
const { CLASS_STATUS, DEFAULT_ATTENDANCE_RADIUS, LATE_GRACE_MINUTES, END_GRACE_MINUTES } = require('../config/constants');

const classSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Date must be in YYYY-MM-DD format',
    },
  },
  startTime: {
    type: String, // Format: HH:mm (24hr)
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'Start time must be in HH:mm format',
    },
  },
  endTime: {
    type: String, // Format: HH:mm (24hr)
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: 'End time must be in HH:mm format',
    },
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  course: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
  // NEW: Class status for cancellation feature
  status: {
    type: String,
    enum: Object.values(CLASS_STATUS),
    default: CLASS_STATUS.SCHEDULED,
  },
  // NEW: Cancellation details
  cancellationReason: {
    type: String,
    maxlength: 500,
    default: null,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // NEW: Configurable settings per class
  attendanceRadius: {
    type: Number,
    default: DEFAULT_ATTENDANCE_RADIUS,
    min: 10,
    max: 500,
  },
  lateGraceMinutes: {
    type: Number,
    default: LATE_GRACE_MINUTES,
    min: 0,
    max: 60,
  },
  endGraceMinutes: {
    type: Number,
    default: END_GRACE_MINUTES,
    min: 0,
    max: 30,
  },
}, { 
  timestamps: true,
});

// Indexes for performance
classSchema.index({ teacher: 1, date: 1 });
classSchema.index({ course: 1, semester: 1, date: 1 });
classSchema.index({ subject: 1 });
classSchema.index({ status: 1 });
classSchema.index({ date: 1, startTime: 1 });

// Virtual to get full datetime objects
classSchema.virtual('startDateTime').get(function() {
  const [hours, minutes] = this.startTime.split(':').map(Number);
  const date = new Date(this.date);
  date.setHours(hours, minutes, 0, 0);
  return date;
});

classSchema.virtual('endDateTime').get(function() {
  const [hours, minutes] = this.endTime.split(':').map(Number);
  const date = new Date(this.date);
  date.setHours(hours, minutes, 0, 0);
  return date;
});

// Method to check if class is currently active
classSchema.methods.isActive = function() {
  if (this.status === CLASS_STATUS.CANCELLED) return false;
  
  const now = new Date();
  const start = this.startDateTime;
  const end = this.endDateTime;
  
  // Add grace period to end time
  end.setMinutes(end.getMinutes() + (this.endGraceMinutes || END_GRACE_MINUTES));
  
  return now >= start && now <= end;
};

// Method to check if attendance would be marked as late
classSchema.methods.isLateAttendance = function() {
  const now = new Date();
  const start = this.startDateTime;
  const lateThreshold = new Date(start);
  lateThreshold.setMinutes(lateThreshold.getMinutes() + (this.lateGraceMinutes || LATE_GRACE_MINUTES));
  
  return now > lateThreshold;
};

// Method to check if class can be cancelled
classSchema.methods.canBeCancelled = function() {
  return this.status === CLASS_STATUS.SCHEDULED;
};

module.exports = mongoose.model('Class', classSchema);
