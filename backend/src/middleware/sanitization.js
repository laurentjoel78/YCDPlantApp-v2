const logger = require('../config/logger');
const validator = require('validator');

/**
 * Custom MongoDB sanitizer that doesn't modify read-only properties
 * Replaces the problematic express-mongo-sanitize
 */
const customMongoSanitizer = (req, res, next) => {
    try {
        // Sanitize request body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        
        // Sanitize query parameters
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        
        // Sanitize URL parameters
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        
        next();
    } catch (error) {
        logger.error('Error in MongoDB sanitization:', error);
        next(); // Continue even if sanitization fails
    }
};

/**
 * Recursively sanitize an object to remove MongoDB operators
 */
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
        // Remove keys that start with $ or contain . (MongoDB operators)
        if (key.startsWith('$') || key.includes('.')) {
            logger.warn(`[SECURITY] Removed prohibited key: ${key}`);
            sanitized[key.replace(/[$\.]/g, '_')] = sanitizeObject(value);
        } else {
            sanitized[key] = sanitizeObject(value);
        }
    }
    
    return sanitized;
};

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
    customMongoSanitizer,
    xssProtection,
    sanitizeString,
    deepSanitize
};
