const logger = require('./logger');

class ErrorLogger {
  static logError(err, req = null, category = 'uncategorized') {
    // Fallback console logging if logger is not properly initialized
    if (!logger || typeof logger.error !== 'function') {
      console.error('Logger not properly initialized. Falling back to console.error');
      console.error('Error:', err);
      if (req) console.error('Request context:', { method: req.method, path: req.path });
      return;
    }
    
    const errorContext = {
      timestamp: new Date().toISOString(),
      category,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code || 'UNKNOWN'
      },
      request: req ? {
        id: req.id,
        method: req.method,
        path: req.path,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        body: req.body,
        headers: {
          'user-agent': req.get('user-agent'),
          'content-type': req.get('content-type'),
          'accept': req.get('accept')
        },
        user: req.user ? {
          id: req.user.id,
          role: req.user.role
        } : null
      } : null,
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    // Log based on error severity
    switch (err.name) {
      case 'ValidationError':
        logger.warn('Validation error occurred', { ...errorContext, validationDetails: err.details });
        break;
      case 'UnauthorizedError':
        logger.warn('Authentication error occurred', errorContext);
        break;
      case 'ForbiddenError':
        logger.warn('Authorization error occurred', errorContext);
        break;
      case 'NotFoundError':
        logger.warn('Resource not found', errorContext);
        break;
      case 'SequelizeError':
        logger.error('Database error occurred', { ...errorContext, sql: err.sql, parameters: err.parameters });
        break;
      default:
        logger.error('Unexpected error occurred', errorContext);
    }

    return errorContext;
  }

  static logRecoveryAttempt(err, action, success) {
    logger.info('Error recovery attempt', {
      error: {
        name: err.name,
        message: err.message
      },
      recovery: {
        action,
        success,
        timestamp: new Date().toISOString()
      }
    });
  }

  static logAPIError(service, endpoint, error, requestData = null) {
    logger.error('External API error', {
      service,
      endpoint,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      },
      request: requestData
    });
  }
}

module.exports = ErrorLogger;