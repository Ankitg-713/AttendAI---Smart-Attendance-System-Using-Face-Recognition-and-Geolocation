const mongoose = require('mongoose');

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
    enum: ['present', 'absent'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Indexes for performance
attendanceSchema.index({ student: 1, class: 1 }, { unique: true });
attendanceSchema.index({ class: 1 });
attendanceSchema.index({ student: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
