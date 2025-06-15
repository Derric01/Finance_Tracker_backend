const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mockAuth = require('../utils/mockAuth');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_here';
    const decoded = jwt.verify(token, jwtSecret);

    // If database is connected, use MongoDB
    if (global.isDbConnected) {
      // Add user to request object
      req.user = await User.findById(decoded.id);
    } else {
      // Use mock auth system when database is unavailable
      const user = mockAuth.findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.'
        });
      }
      req.user = { id: decoded.id };
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};
