const auditService = require('../services/auditService');

const TRACKED_ACTIONS = {
    // Authentication
    LOGIN: 'USER_LOGIN',
    LOGOUT: 'USER_LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',

    // Content Actions
    POST_CREATE: 'POST_CREATE',
    POST_UPDATE: 'POST_UPDATE',
    POST_DELETE: 'POST_DELETE',
    COMMENT_CREATE: 'COMMENT_CREATE',

    // Marketplace
    PRODUCT_VIEW: 'PRODUCT_VIEW',
    PRODUCT_CREATE: 'PRODUCT_CREATE',
    PRODUCT_PURCHASE: 'PRODUCT_PURCHASE',

    // Expert Consultations
    CONSULTATION_REQUEST: 'CONSULTATION_REQUEST',
    EXPERT_RATING: 'EXPERT_RATING',

    // Forum Activities
    TOPIC_CREATE: 'TOPIC_CREATE',
    TOPIC_VIEW: 'TOPIC_VIEW',
    FORUM_POST: 'FORUM_POST'
};

/**
 * Middleware to track user activity
 * Automatically logs user actions to the audit system
 */
async function trackActivity(req, res, next) {
    // Skip tracking for certain routes
    const skipRoutes = ['/health', '/metrics', '/favicon.ico'];
    if (skipRoutes.some(route => req.path.includes(route))) {
        return next();
    }

    // Only track authenticated users
    if (!req.user) {
        return next();
    }

    // Store original methods
    const originalJson = res.json;
    const startTime = Date.now();

    // Override response method to log after successful actions
    res.json = function (data) {
        logActivity(req, res, startTime, data);
        return originalJson.call(this, data);
    };

    next();
}

async function logActivity(req, res, startTime, responseData) {
    try {
        // Only log successful actions (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
            const duration = Date.now() - startTime;

            await auditService.logUserAction({
                userId: req.user.id,
                userRole: req.user.role,
                actionType: mapRouteToAction(req.method, req.path),
                actionDescription: `${req.method} ${req.path}`,
                req,
                metadata: {
                    duration,
                    statusCode: res.statusCode,
                    body: sanitizeData(req.body),
                    params: req.params,
                    query: req.query,
                    success: responseData?.success
                }
            });
        }
    } catch (error) {
        console.error('Activity tracking error:', error);
        // Don't fail the request if logging fails
    }
}

function mapRouteToAction(method, path) {
    // Authentication
    if (path.includes('/auth/login')) return TRACKED_ACTIONS.LOGIN;
    if (path.includes('/auth/logout')) return TRACKED_ACTIONS.LOGOUT;
    if (path.includes('/auth/password')) return TRACKED_ACTIONS.PASSWORD_CHANGE;

    // Forums
    if (path.includes('/forums/topics') && method === 'POST') return TRACKED_ACTIONS.TOPIC_CREATE;
    if (path.includes('/forums/topics') && method === 'GET') return TRACKED_ACTIONS.TOPIC_VIEW;
    if (path.includes('/forums') && path.includes('/posts') && method === 'POST') return TRACKED_ACTIONS.FORUM_POST;

    // Products
    if (path.includes('/products') && method === 'POST') return TRACKED_ACTIONS.PRODUCT_CREATE;
    if (path.includes('/products') && method === 'GET') return TRACKED_ACTIONS.PRODUCT_VIEW;

    // Experts
    if (path.includes('/experts') && path.includes('/rate')) return TRACKED_ACTIONS.EXPERT_RATING;
    if (path.includes('/consultations') && method === 'POST') return TRACKED_ACTIONS.CONSULTATION_REQUEST;

    // Default action name
    return `${method}_${path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`.toUpperCase();
}

function sanitizeData(data) {
    if (!data) return {};

    // Remove sensitive fields before logging
    const sanitized = { ...data };
    const sensitiveFields = [
        'password',
        'password_hash',
        'token',
        'accessToken',
        'refreshToken',
        'creditCard',
        'cvv',
        'pin'
    ];

    sensitiveFields.forEach(field => {
        delete sanitized[field];
    });

    return sanitized;
}

module.exports = { trackActivity, TRACKED_ACTIONS };
