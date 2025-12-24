const mongoose = require('mongoose');
const { COURSES } = require('../config/constants');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
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
    enum: COURSES,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Optional: description or code for the subject
  code: {
    type: String,
    trim: true,
    maxlength: 20,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Indexes for performance
subjectSchema.index({ teacher: 1 });
subjectSchema.index({ course: 1, semester: 1 });
subjectSchema.index({ name: 1, course: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
