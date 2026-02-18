/**
 * Redis Cache Service
 * General-purpose caching to reduce Neon database compute usage
 * Uses Upstash Redis (free tier: 10,000 commands/day)
 */

const Redis = require('ioredis');
const logger = require('../config/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  /**
   * Initialize Redis connection
   * Falls back gracefully if Redis is unavailable
   */
  async connect() {
    if (this.client && this.isConnected) {
      return true;
    }

    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      logger.warn('REDIS_URL not configured - caching disabled, using database directly');
      return false;
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        connectTimeout: 5000,
        // Upstash requires TLS
        tls: redisUrl.startsWith('rediss://') ? {} : undefined
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info('✅ Redis connected - caching enabled');
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      await this.client.connect();
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} - Parsed value or null if not found/error
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(data);
      }
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set cached value with expiry
   * @param {string} key - Cache key
   * @param {any} value - Value to cache (will be JSON stringified)
   * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
   */
  async set(key, value, ttlSeconds = 300) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
      logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key or pattern
   */
  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      logger.debug(`Cache DEL: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache del error for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   * @param {string} pattern - Pattern like "user:*" or "crops:*"
   */
  async delByPattern(pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`Cache DEL pattern: ${pattern} (${keys.length} keys)`);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delByPattern error for ${pattern}:`, error.message);
      return false;
    }
  }

  /**
   * Get or set with callback (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Async function to fetch data if not cached
   * @param {number} ttlSeconds - TTL in seconds
   */
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    // Try cache first
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source (database)
    const data = await fetchFn();
    
    // Cache for next time
    if (data !== null && data !== undefined) {
      await this.set(key, data, ttlSeconds);
    }

    return data;
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return this.isConnected && this.client !== null;
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();

// Cache key builders for consistency
const CacheKeys = {
  // User data - cache for 1 hour
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:profile:${userId}`,
  
  // Crops - cache for 24 hours (rarely changes)
  allCrops: () => 'crops:all',
  cropById: (cropId) => `crop:${cropId}`,
  cropsByRegion: (region) => `crops:region:${region}`,
  
  // Diseases - cache for 24 hours
  allDiseases: () => 'diseases:all',
  diseaseById: (diseaseId) => `disease:${diseaseId}`,
  diseasesByCrop: (cropId) => `diseases:crop:${cropId}`,
  
  // Markets - cache for 2 hours (optimized for poor connectivity)
  allMarkets: () => 'markets:all',
  marketsByRegion: (region) => `markets:region:${region}`,
  
  // Weather - cache for 1 hour (optimized for poor connectivity)
  weather: (farmId) => `weather:${farmId}`,
  forecast: (farmId) => `forecast:${farmId}`,
  
  // Forum - cache for 30 minutes (optimized for poor connectivity)
  forumPosts: (page) => `forum:posts:page:${page}`,
  forumPost: (postId) => `forum:post:${postId}`,
  
  // Guidelines - cache for 24 hours
  guidelines: (cropId, region) => `guidelines:${cropId}:${region}`,
  
  // AI chat - cache common questions for 1 hour
  chatResponse: (questionHash) => `chat:${questionHash}`,
};

// TTL constants (in seconds) - optimized for areas with poor connectivity
const CacheTTL = {
  SHORT: 600,        // 10 minutes (was 5)
  MEDIUM: 1800,      // 30 minutes  
  LONG: 3600,        // 1 hour
  EXTENDED: 7200,    // 2 hours (new - for markets, products)
  VERY_LONG: 86400,  // 24 hours
};

module.exports = {
  cacheService,
  CacheKeys,
  CacheTTL
};
