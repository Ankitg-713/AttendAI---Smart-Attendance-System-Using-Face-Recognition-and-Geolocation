// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ========================
// Middleware
// ========================
const allowedOrigins = [
  'http://localhost:5173', // Local Vite dev
  'http://localhost:3000', // Alternative local
  process.env.FRONTEND_URL // Production URL from env
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// ========================
// Import Routes
// ========================
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const adminRoutes = require('./routes/adminRoutes'); // New admin routes
const teacherRoutes = require('./routes/teacherRoutes');

// ========================
// API Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes); // Admin-only routes
app.use('/api/teacher', teacherRoutes);

// ========================
// Test Route
// ========================
app.get('/', (req, res) => {
  res.send('API is running...');
});

// ========================
// Connect DB and Start Server
// ========================
const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
