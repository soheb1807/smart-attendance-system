const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 1. Verify Token & Device Binding
 * Now checks if the device making the request matches the user's registered device.
 */
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // 🔒 SECURITY LAYER: Check Device ID on every protected request
      // This prevents someone from using a copied token on a different device
      const requestDeviceId = req.headers['x-device-id']; // Sent from frontend headers
      
      if (user.role === 'student' && user.trustedDeviceId) {
        if (requestDeviceId && user.trustedDeviceId !== requestDeviceId) {
          return res.status(403).json({ 
            message: 'Security Alert: Device mismatch. Please use your registered device.' 
          });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth Error:", error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

/**
 * 2. Role Restriction
 * Allows specific roles (admin, teacher, etc.) to access specific routes.
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user?.role || 'unknown'}' is not authorized to access this route` 
      });
    }
    next();
  };
};