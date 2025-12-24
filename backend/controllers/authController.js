const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { euclideanDistance, FACE_MATCH_THRESHOLD, isValidDescriptor } = require("../utils/faceRecognition");
const { JWT_EXPIRY, ROLES } = require("../config/constants");

// ========================
// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
// ========================
exports.register = async (req, res) => {
  try {
    // Validation is handled by middleware, so values are already sanitized
    const { name, email, password, role, faceDescriptor, course, semester } = req.body;

    // Additional validation for face descriptor
    if (!isValidDescriptor(faceDescriptor)) {
      return res.status(400).json({ message: "Invalid face descriptor format" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with enrollment date
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      faceDescriptor,
      enrollmentDate: new Date(), // Track when they enrolled
    };

    // Add student-specific fields
    if (role === ROLES.STUDENT) {
      userData.course = course;
      userData.semester = semester;
      
      // Add to enrollment history
      userData.enrollmentHistory = [{
        course,
        semester,
        enrolledAt: new Date(),
        status: 'active',
      }];
    }

    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ========================
// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
// ========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact admin." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        course: user.course || null,
        semester: user.semester || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ========================
// @desc    Get Current User
// @route   GET /api/auth/me
// @access  Private
// ========================
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password -faceDescriptor");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      course: user.course || null,
      semester: user.semester || null,
      enrollmentDate: user.enrollmentDate,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
