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

module.exports = mongoose.model('Subject', subjectSchema);
