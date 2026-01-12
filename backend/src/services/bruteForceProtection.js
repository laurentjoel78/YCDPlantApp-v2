/**
 * Brute Force Protection Service
 * Tracks failed authentication attempts and temporarily blocks suspicious IPs/users
 */

const logger = require('../config/logger');

class BruteForceProtection {
    constructor() {
        // In-memory storage (use Redis in production for distributed systems)
        this.loginAttempts = new Map(); // IP -> { count, firstAttempt, blockedUntil }
        this.userAttempts = new Map(); // userId -> { count, firstAttempt, blockedUntil }
        
        // Configuration
        this.maxAttempts = 5;
        this.windowMs = 15 * 60 * 1000; // 15 minutes
        this.blockDurationMs = 60 * 60 * 1000; // 1 hour block
        
        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Record a failed login attempt
     */
    recordFailedAttempt(ip, userId = null) {
        const now = Date.now();

        // Track by IP
        if (!this.loginAttempts.has(ip)) {
            this.loginAttempts.set(ip, {
                count: 1,
                firstAttempt: now,
                blockedUntil: null
            });
        } else {
            const attempt = this.loginAttempts.get(ip);
            
            // Reset if window expired
            if (now - attempt.firstAttempt > this.windowMs) {
                attempt.count = 1;
                attempt.firstAttempt = now;
                attempt.blockedUntil = null;
            } else {
                attempt.count++;
                
                // Block if max attempts exceeded
                if (attempt.count >= this.maxAttempts) {
                    attempt.blockedUntil = now + this.blockDurationMs;
                    logger.warn(`[SECURITY] IP ${ip} blocked due to ${attempt.count} failed login attempts`);
                }
            }
        }

        // Track by user ID if provided
        if (userId) {
            if (!this.userAttempts.has(userId)) {
                this.userAttempts.set(userId, {
                    count: 1,
                    firstAttempt: now,
                    blockedUntil: null
                });
            } else {
                const attempt = this.userAttempts.get(userId);
                
                if (now - attempt.firstAttempt > this.windowMs) {
                    attempt.count = 1;
                    attempt.firstAttempt = now;
                    attempt.blockedUntil = null;
                } else {
                    attempt.count++;
                    
                    if (attempt.count >= this.maxAttempts) {
                        attempt.blockedUntil = now + this.blockDurationMs;
                        logger.warn(`[SECURITY] User ${userId} blocked due to ${attempt.count} failed login attempts`);
                    }
                }
            }
        }
    }

    /**
     * Reset attempts after successful login
     */
    resetAttempts(ip, userId = null) {
        this.loginAttempts.delete(ip);
        if (userId) {
            this.userAttempts.delete(userId);
        }
    }

    /**
     * Check if IP or user is blocked
     */
    isBlocked(ip, userId = null) {
        const now = Date.now();

        // Check IP block
        const ipAttempt = this.loginAttempts.get(ip);
        if (ipAttempt && ipAttempt.blockedUntil && now < ipAttempt.blockedUntil) {
            const remainingMs = ipAttempt.blockedUntil - now;
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            return {
                blocked: true,
                reason: 'Too many failed login attempts from this IP',
                remainingMinutes
            };
        }

        // Check user block
        if (userId) {
            const userAttempt = this.userAttempts.get(userId);
            if (userAttempt && userAttempt.blockedUntil && now < userAttempt.blockedUntil) {
                const remainingMs = userAttempt.blockedUntil - now;
                const remainingMinutes = Math.ceil(remainingMs / 60000);
                return {
                    blocked: true,
                    reason: 'Too many failed login attempts for this account',
                    remainingMinutes
                };
            }
        }

        return { blocked: false };
    }

    /**
     * Get remaining attempts before block
     */
    getRemainingAttempts(ip) {
        const attempt = this.loginAttempts.get(ip);
        if (!attempt) return this.maxAttempts;
        
        const now = Date.now();
        if (now - attempt.firstAttempt > this.windowMs) {
            return this.maxAttempts;
        }
        
        return Math.max(0, this.maxAttempts - attempt.count);
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        
        // Clean IP attempts
        for (const [ip, attempt] of this.loginAttempts.entries()) {
            if (attempt.blockedUntil && now > attempt.blockedUntil) {
                this.loginAttempts.delete(ip);
            } else if (now - attempt.firstAttempt > this.windowMs && !attempt.blockedUntil) {
                this.loginAttempts.delete(ip);
            }
        }

        // Clean user attempts
        for (const [userId, attempt] of this.userAttempts.entries()) {
            if (attempt.blockedUntil && now > attempt.blockedUntil) {
                this.userAttempts.delete(userId);
            } else if (now - attempt.firstAttempt > this.windowMs && !attempt.blockedUntil) {
                this.userAttempts.delete(userId);
            }
        }
    }

    /**
     * Middleware to check if request is blocked
     */
    checkBlocked() {
        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const blockStatus = this.isBlocked(ip);
            
            if (blockStatus.blocked) {
                return res.status(429).json({
                    error: blockStatus.reason,
                    retryAfter: blockStatus.remainingMinutes,
                    message: `Please try again in ${blockStatus.remainingMinutes} minute(s)`
                });
            }
            
            next();
        };
    }
}

// Export singleton instance
const bruteForceProtection = new BruteForceProtection();

module.exports = bruteForceProtection;
