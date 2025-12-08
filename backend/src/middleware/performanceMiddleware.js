const performanceMonitor = require('../services/performanceMonitor');
const loggingService = require('../services/loggingService');
const { v4: uuidv4 } = require('uuid');

const performanceMiddleware = async (req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const tracker = performanceMonitor.trackRequest(requestId);

    // Add tracker to response locals for potential use in route handlers
    res.locals.performanceTracker = tracker;

    // Track response time
    res.on('finish', async () => {
        const duration = tracker.end(res.statusCode >= 400 ? new Error(`HTTP ${res.statusCode}`) : null);

        // Log performance data
        await loggingService.logSystem({
            logLevel: 'info',
            module: 'Performance',
            message: `Request completed: ${req.method} ${req.path}`,
            requestId,
            performanceMetrics: {
                duration,
                statusCode: res.statusCode,
                method: req.method,
                path: req.path,
                userAgent: req.headers['user-agent']
            }
        });

        // Log slow requests
        if (duration > performanceMonitor.thresholds.responseTime) {
            await loggingService.logSystem({
                logLevel: 'warn',
                module: 'Performance',
                message: `Slow request detected: ${req.method} ${req.path}`,
                requestId,
                performanceMetrics: {
                    duration,
                    threshold: performanceMonitor.thresholds.responseTime,
                    path: req.path,
                    query: req.query,
                    body: req.method === 'GET' ? undefined : '[REDACTED]'
                }
            });
        }
    });

    next();
};

module.exports = performanceMiddleware;