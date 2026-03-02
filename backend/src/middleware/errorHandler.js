const ErrorLogger = require('../utils/errorLogger');
const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  // Handle Multer file upload errors early (before generic logging)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  // Handle file filter rejections (not MulterError but thrown by fileFilter)
  if (err.message && (err.message.includes('file type') || err.message.includes('image'))) {
    return res.status(400).json({ error: err.message });
  }

  // Log error with full context
  const errorContext = ErrorLogger.logError(err, req, getErrorCategory(err));

  // Handle different types of errors
  switch (err.name) {
    case 'ValidationError':
      return res.status(400).json({
        error: 'Validation Error',
        details: err.details,
        requestId: req.id
      });

    case 'UnauthorizedError':
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token',
        requestId: req.id
      });

    case 'ForbiddenError':
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
        requestId: req.id
      });

    case 'NotFoundError':
      return res.status(404).json({
        error: 'Not Found',
        message: err.message,
        requestId: req.id
      });

    case 'SequelizeError':
      // Attempt recovery for certain database errors
      if (err.name === 'SequelizeConnectionError') {
        attemptDatabaseRecovery();
      }
      return res.status(503).json({
        error: 'Service Temporarily Unavailable',
        message: 'Database operation failed',
        requestId: req.id
      });

    default:
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        requestId: req.id
      });
  }
};

function getErrorCategory(err) {
  switch (err.name) {
    case 'ValidationError':
      return 'validation';
    case 'UnauthorizedError':
    case 'ForbiddenError':
      return 'auth';
    case 'SequelizeError':
      return 'database';
    case 'NotFoundError':
      return 'not_found';
    default:
      return 'system';
  }
}

async function attemptDatabaseRecovery(err) {
  try {
    const sequelize = require('../config/sequelize');
    await sequelize.authenticate();
    ErrorLogger.logRecoveryAttempt(err, 'database_reconnect', true);
  } catch (recoveryError) {
    ErrorLogger.logRecoveryAttempt(err, 'database_reconnect', false);
  }
}

module.exports = {
  errorHandler,
  getErrorCategory
};

module.exports = errorHandler;