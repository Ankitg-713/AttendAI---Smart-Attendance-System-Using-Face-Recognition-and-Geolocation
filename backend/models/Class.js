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
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
