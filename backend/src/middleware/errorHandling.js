const loggingService = require('../services/loggingService');

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = async (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  await loggingService.logSystem({
    logLevel: err.statusCode >= 500 ? 'error' : 'warn',
    module: 'ErrorHandler',
    message: err.message,
    errorDetails: {
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      stack: err.stack,
      isOperational: err.isOperational || false,
      originalError: err
    }
  });

  // If user is authenticated, log as user activity
  if (req.user) {
    await loggingService.logUserActivity({
      userId: req.user.id,
      activityType: 'error',
      description: err.message,
      status: 'error',
      metadata: {
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        path: req.path,
        method: req.method
      }
    });
  }

  // For critical errors, create an audit log
  if (err.statusCode >= 500) {
    await loggingService.logAudit({
      userId: req.user?.id,
      userRole: req.user?.role,
      actionType: 'system_error',
      severity: 'critical',
      metadata: {
        error: err.message,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        path: req.path,
        method: req.method
      }
    });
  }

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Production error response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming or unknown error: don't leak error details
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
};

module.exports = {
  AppError,
  errorHandler
};