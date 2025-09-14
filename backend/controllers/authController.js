const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const euclideanDistance = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return Infinity;
  return Math.sqrt(
    arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
  );
};

// ========================
// @desc    Register User
// ========================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, faceDescriptor, course, semester } =
      req.body;

    if (
      !name ||
      !email ||
      !password ||
      !role ||
      !faceDescriptor ||
      (role === "student" && (!course || !semester))
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      faceDescriptor,
      ...(role === "student" && { course, semester }), // add these for students
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================
// @desc    Login via Face Descriptor
// ========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================
// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private (needs verifyToken middleware)
// ========================
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Explicitly send structured response
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      course: user.course || null, // only students will have this
      semester: user.semester || null, // only students will have this
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
