const logger = require('../config/logger');
const auditService = require('../services/auditService');

const auditMiddleware = async (req, res, next) => {
  // Store original response methods to track response
  const originalSend = res.send;
  const originalJson = res.json;
  const startTime = Date.now();

  // Capture request body while respecting sensitive data
  const safeReqBody = { ...req.body };
  delete safeReqBody.password;
  delete safeReqBody.token;
  delete safeReqBody.creditCard;

  // Track response
  res.send = function (body) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log performance data
    auditService.logPerformance({
      endpoint: req.originalUrl,
      responseTime,
      status: res.statusCode,
      requestMethod: req.method,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      requestSize: JSON.stringify(safeReqBody).length,
      responseSize: JSON.stringify(body).length,
      userId: req.user ? req.user.id : null
    }).catch(logger.error);

    // If it's an error response, log it as a system event
    if (res.statusCode >= 400) {
      auditService.logSystemEvent({
        logLevel: res.statusCode >= 500 ? 'error' : 'warning',
        module: req.baseUrl,
        message: `${req.method} ${req.originalUrl} returned ${res.statusCode}`,
        errorDetails: {
          statusCode: res.statusCode,
          error: body.error || body,
          requestBody: safeReqBody,
          requestHeaders: req.headers
        }
      }).catch(logger.error);
    }

    // Call original send
    return originalSend.call(this, body);
  };

  // Track json response
  res.json = function (body) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log performance data
    auditService.logPerformance({
      endpoint: req.originalUrl,
      responseTime,
      status: res.statusCode,
      requestMethod: req.method,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      requestSize: JSON.stringify(safeReqBody).length,
      responseSize: JSON.stringify(body).length,
      userId: req.user ? req.user.id : null
    }).catch(logger.error);

    // If it's an error response, log it as a system event
    if (res.statusCode >= 400) {
      auditService.logSystemEvent({
        logLevel: res.statusCode >= 500 ? 'error' : 'warning',
        module: req.baseUrl,
        message: `${req.method} ${req.originalUrl} returned ${res.statusCode}`,
        errorDetails: {
          statusCode: res.statusCode,
          error: body.error || body,
          requestBody: safeReqBody,
          requestHeaders: req.headers
        }
      }).catch(logger.error);
    }

    // Call original json
    return originalJson.call(this, body);
  };

  next();
};

module.exports = auditMiddleware;