const jwt = require('jsonwebtoken');

// ========================
// @desc    Verify JWT Token
// ========================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('📩 Received Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No token provided or invalid format');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔐 Extracted Token:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token Decoded:', decoded); // Should show { id, role, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ JWT Verification Failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ========================
// @desc    Role-Based Access Control
// ========================
const verifyRole = (requiredRole) => {
  return (req, res, next) => {
    console.log('🔍 Verifying Role:', req.user?.role, '| Required:', requiredRole);
    if (!req.user || req.user.role !== requiredRole) {
      console.log('⛔ Access Denied: Role mismatch');
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    console.log('✅ Role verified');
    next();
  };
};

// ========================
// @desc    Verify Admin
// ========================
const verifyAdmin = (req, res, next) => {
  console.log('🔍 Checking if user is admin:', req.user?.role);
  if (!req.user || req.user.role !== 'admin') {
    console.log('⛔ Access Denied: Not an admin');
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  console.log('✅ Admin verified');
  next();
};

module.exports = {
  verifyToken,
  verifyRole,
  verifyAdmin,
};
