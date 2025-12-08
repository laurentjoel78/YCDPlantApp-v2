const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Custom format for detailed logging
const detailedFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.metadata(),
  format.json()
);

// Create the logger instance with all required methods
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: detailedFormat,
  defaultMeta: { service: 'ycd-app' },
  transports: [
    // Write logs to console with color
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, metadata, stack }) => {
          let log = `${timestamp} ${level}: ${message}`;
          
          // Add metadata if present
          if (metadata && Object.keys(metadata).length > 0) {
            const { service, requestId, userId, ...rest } = metadata;
            if (Object.keys(rest).length > 0) {
              log += `\nMetadata: ${JSON.stringify(rest, null, 2)}`;
            }
          }
          
          // Add stack trace for errors
          if (stack) {
            log += `\nStack: ${stack}`;
          }
          
          return log;
        })
      )
    }),
    
    // Write all logs with level info and below to combined.log
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: detailedFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    
    // Write all error logs to error.log
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: detailedFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  ]
});

// Explicitly ensure all logging methods are available
const logMethods = ['error', 'warn', 'info', 'debug'];
logMethods.forEach(method => {
  if (typeof logger[method] !== 'function') {
    logger[method] = function(message, meta) {
      return logger.log(method, message, meta);
    };
  }
});

// Add request context middleware
const addContext = (req, res, next) => {
  const requestId = uuidv4();
  const userId = req.user ? req.user.id : undefined;
  
  // Create a child logger with request context
  req.log = logger.child({
    requestId,
    userId,
    path: req.path,
    method: req.method
  });
  
  next();
};

// Utility functions for consistent logging
const logRequest = (req, message = 'Request received') => {
  if (!req.log) return logger.info(message);
  
  const logData = {
    query: req.query,
    params: req.params,
    body: req.method !== 'GET' ? req.body : undefined
  };

  req.log.info(message, logData);
};

const logResponse = (req, res, data) => {
  if (!req.log) return logger.info('Response sent');
  
  req.log.info('Response sent', {
    statusCode: res.statusCode,
    responseData: data
  });
};

const logError = (req, error) => {
  if (!req.log) return logger.error(error);
  
  req.log.error('Error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
};

module.exports = {
  logger,
  addContext,
  logRequest,
  logResponse,
  logError
};