const logger = require('../config/logger');

const createErrorResponse = (code, message, details = null, requestId = null) => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString(),
  requestId
});

const errorHandler = (err, req, res, next) => {
  const requestId = req.correlationId || 'unknown';
  
  // Log the error
  logger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json(
      createErrorResponse('VALIDATION_ERROR', 'Validation failed', details, requestId)
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(
      createErrorResponse('DUPLICATE_RESOURCE', `${field} already exists`, null, requestId)
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      createErrorResponse('AUTHENTICATION_FAILED', 'Invalid token', null, requestId)
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      createErrorResponse('AUTHENTICATION_FAILED', 'Token expired', null, requestId)
    );
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.code || 'APPLICATION_ERROR', err.message, err.details, requestId)
    );
  }

  // Default server error
  res.status(500).json(
    createErrorResponse('INTERNAL_SERVER_ERROR', 'Internal server error', null, requestId)
  );
};

module.exports = errorHandler;