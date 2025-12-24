const mongoose = require('mongoose');
const { ROLES, COURSES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true,
  },
  course: {
    type: String,
    enum: [...COURSES, null],
    default: null,
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    default: null,
  },
  faceDescriptor: {
    type: [Number],
    validate: {
      validator: function(arr) {
        return arr.length === 0 || arr.length === 128;
      },
      message: 'Face descriptor must be 128 dimensions',
    },
  },
  // NEW: Track when student enrolled (for mid-semester registration handling)
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  // NEW: Track enrollment history for complex scenarios
  enrollmentHistory: [{
    course: String,
    semester: Number,
    enrolledAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['active', 'dropped', 'completed', 'transferred'],
      default: 'active',
    },
  }],
  // NEW: Account status
  isActive: {
    type: Boolean,
    default: true,
  },
}, { 
  timestamps: true,
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ course: 1, semester: 1 });
userSchema.index({ enrollmentDate: 1 });

// Virtual for full enrollment info
userSchema.virtual('currentEnrollment').get(function() {
  if (this.role !== 'student') return null;
  return {
    course: this.course,
    semester: this.semester,
    enrolledAt: this.enrollmentDate,
  };
});

module.exports = mongoose.model('User', userSchema);
