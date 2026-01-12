const { addContext, logRequest, logResponse } = require('../utils/logger');
const logger = require('../config/logger');
const geoip = require('geoip-lite');
const DeviceDetector = require('node-device-detector');
const detector = new DeviceDetector();
const { v4: uuidv4 } = require('uuid');

const requestLoggingMiddleware = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || uuidv4();

    // Add request context to logger
    req.log = {
      error: (msg, meta = {}) => {
        logger.error(msg, { requestId, ...meta });
      },
      info: (msg, meta = {}) => {
        logger.info(msg, { requestId, ...meta });
      },
      warn: (msg, meta = {}) => {
        logger.warn(msg, { requestId, ...meta });
      },
      debug: (msg, meta = {}) => {
        logger.debug(msg, { requestId, ...meta });
      }
    };

    // Get IP and location
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const geo = geoip.lookup(ip) || {};
    
    // Parse user agent
    const userAgent = req.headers['user-agent'];
    const deviceInfo = detector.detect(userAgent);

    // Set up response interceptor
    const originalJson = res.json;
    res.json = function(body) {
      res.locals.responseBody = body;
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log response with detailed context
      logResponse(req, res, {
        statusCode: res.statusCode,
        duration,
        requestId,
        metadata: {
          ip,
          geo,
          userAgent,
          deviceInfo,
          user: req.user ? {
            id: req.user.id,
            role: req.user.role
          } : undefined
        }
      });

      return originalJson.call(this, body);
    };

    // Log the incoming request with detailed context
    logRequest(req, {
      message: `${req.method} ${req.path}`,
      requestId,
      metadata: {
        ip,
        geo,
        userAgent,
        deviceInfo,
        headers: req.headers,
        query: req.query,
        params: req.params,
        // Don't log sensitive body data
        body: req.method === 'GET' ? undefined : '[REDACTED]',
        user: req.user ? {
          id: req.user.id,
          role: req.user.role
        } : undefined
      }
    });

    // Listen for request completion
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      logRequest(req, {
        message: `${req.method} ${req.path} completed`,
        requestId,
        metadata: {
          statusCode,
          duration,
          responseBody: statusCode >= 400 ? res.locals.responseBody : undefined
        }
      });
    });

    next();
  } catch (error) {
    // Log error and continue
    logRequest(req, {
      level: 'error',
      message: 'Error in request logging middleware',
      requestId: req.headers['x-request-id'] || uuidv4(),
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    next(error);
  }
};

module.exports = requestLoggingMiddleware;