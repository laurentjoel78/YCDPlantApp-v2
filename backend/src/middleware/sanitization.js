const logger = require('../config/logger');
const mongoSanitize = require('express-mongo-sanitize');
const validator = require('validator');

/**
 * Sanitize request data to prevent NoSQL injection and XSS attacks
 * This middleware should be applied before parsing request bodies
 */

// Remove any keys that start with $ or contain . (MongoDB operators)
const mongoSanitizer = mongoSanitize({
    replaceWith: '_', // Replace prohibited characters with underscore
    onSanitize: ({ req, key }) => {
        logger.warn(`[SECURITY] Sanitized key in ${req.path}: ${key}`);
    }
});

// Sanitize string inputs to prevent XSS
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potential XSS characters
    return validator.escape(str);
};

// Recursive sanitization for nested objects
const deepSanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Sanitize key
        const cleanKey = key.replace(/[$\.]/g, '_');
        
        // Sanitize value based on type
        if (typeof value === 'string') {
            sanitized[cleanKey] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[cleanKey] = deepSanitize(value);
        } else {
            sanitized[cleanKey] = value;
        }
    }
    return sanitized;
};

// Custom middleware for additional XSS protection
const xssProtection = (req, res, next) => {
    // Skip sanitization for file uploads
    if (req.is('multipart/form-data')) {
        return next();
    }

    // Sanitize body
    if (req.body) {
        req.body = deepSanitize(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        req.query = deepSanitize(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
        req.params = deepSanitize(req.params);
    }

    next();
};

module.exports = {
    mongoSanitizer,
    xssProtection,
    sanitizeString,
    deepSanitize
};
