/**
 * Middleware to notify clients when cached data should be invalidated
 * Add this to routes that modify user data
 */

const logger = require('../config/logger');
const socketService = require('../services/socketService');

/**
 * Send cache invalidation event to specific user
 */
function invalidateUserCache(userId, keys) {
    try {
        socketService.emitToUser(userId, 'CACHE_INVALIDATE', { keys });
        logger.info(`[Cache] Invalidated cache for user ${userId}:`, keys);
    } catch (error) {
        logger.error('[Cache] Error sending invalidation:', error);
    }
}

/**
 * Middleware to auto-invalidate user cache after profile updates
 */
function invalidateCacheOnUpdate(req, res, next) {
    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to add cache invalidation
    res.json = function (data) {
        // If update was successful, invalidate user cache
        if (req.method !== 'GET' && res.statusCode < 400 && req.user?.id) {
            invalidateUserCache(req.user.id, ['user_profile', 'user_farms']);
        }

        // Call original json method
        return originalJson(data);
    };

    next();
}

module.exports = {
    invalidateUserCache,
    invalidateCacheOnUpdate
};
