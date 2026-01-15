/**
 * Authentication and authorization middleware
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Create application error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @returns {Error}
 */
const createError = (message, statusCode = 500, code = 'APPLICATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

/**
 * Authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token required', 401, 'AUTHENTICATION_FAILED');
    }
    
    const token = authHeader.substring(7);
    
    // Use same fallback JWT_SECRET as in login route
    const jwtSecret = process.env.JWT_SECRET || 'temporary-jwt-secret-for-development-only';
    
    const decoded = jwt.verify(token, jwtSecret);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw createError('Invalid or inactive user', 401, 'AUTHENTICATION_FAILED');
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(createError('Invalid or expired token', 401, 'AUTHENTICATION_FAILED'));
    } else {
      next(error);
    }
  }
};

/**
 * Authorize user roles
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function}
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401, 'AUTHENTICATION_FAILED');
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed', {
          userId: req.user._id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          correlationId: req.correlationId
        });
        
        throw createError('Insufficient permissions', 403, 'AUTHORIZATION_FAILED');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check specific permission
 * @param {string} permission - Permission to check
 * @returns {Function}
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401, 'AUTHENTICATION_FAILED');
      }
      
      if (!req.user.hasPermission(permission)) {
        logger.warn('Permission check failed', {
          userId: req.user._id,
          userRole: req.user.role,
          requiredPermission: permission,
          correlationId: req.correlationId
        });
        
        throw createError('Insufficient permissions', 403, 'AUTHORIZATION_FAILED');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  requirePermission
};