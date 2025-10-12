const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true,
  },
  course: {        // Only for students
    type: String,
  },
  semester: {      // Only for students
    type: Number,
  },
  faceDescriptor: {
    type: [Number], // 128-length descriptor array
  },
}, { timestamps: true });

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ course: 1, semester: 1 });

module.exports = mongoose.model('User', userSchema);
