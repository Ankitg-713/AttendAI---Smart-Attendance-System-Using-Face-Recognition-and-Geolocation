const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  course: {
    type: String,
    required: true, // "MCA"
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // Assigned by admin
  },
}, { timestamps: true });

// Indexes for performance
subjectSchema.index({ teacher: 1 });
subjectSchema.index({ course: 1, semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
