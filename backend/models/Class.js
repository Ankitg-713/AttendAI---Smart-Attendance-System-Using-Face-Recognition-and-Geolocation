const mongoose = require('mongoose');

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
  },
  startTime: {
    type: String, // Format: HH:mm (24hr)
    required: true,
  },
  endTime: {
    type: String, // Format: HH:mm (24hr)
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

// Indexes for performance
classSchema.index({ teacher: 1, date: 1 });
classSchema.index({ course: 1, semester: 1, date: 1 });
classSchema.index({ subject: 1 });

module.exports = mongoose.model('Class', classSchema);
