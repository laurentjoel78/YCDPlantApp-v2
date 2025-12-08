import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Production-grade cache manager with automatic invalidation
 */

// Cache version - increment this when user schema changes
const CACHE_VERSION = '1.0.0';
const VERSION_KEY = 'cache_version';

export interface CacheConfig {
    key: string;
    ttl?: number; // Time to live in milliseconds
    version?: string;
}

export class CacheManager {
    /**
     * Store data with automatic versioning and TTL
     */
    static async set<T>(key: string, data: T, ttl?: number): Promise<void> {
        try {
            const cacheEntry = {
                data,
                timestamp: Date.now(),
                ttl: ttl || null,
                version: CACHE_VERSION
            };

            await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
        } catch (error) {
            console.error(`[CacheManager] Error setting ${key}:`, error);
        }
    }

    /**
     * Get data with automatic expiration check
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const cached = await AsyncStorage.getItem(key);
            if (!cached) return null;

            const entry = JSON.parse(cached);

            // Check version mismatch (schema changed)
            if (entry.version !== CACHE_VERSION) {
                console.log(`[CacheManager] Version mismatch for ${key}, invalidating`);
                await this.remove(key);
                return null;
            }

            // Check if expired
            if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
                console.log(`[CacheManager] Expired cache for ${key}`);
                await this.remove(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.error(`[CacheManager] Error getting ${key}:`, error);
            return null;
        }
    }

    /**
     * Remove specific cache entry
     */
    static async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`[CacheManager] Error removing ${key}:`, error);
        }
    }

    /**
     * Clear ALL cache (useful for logout or version upgrades)
     */
    static async clearAll(): Promise<void> {
        try {
            await AsyncStorage.clear();
            console.log('[CacheManager] All cache cleared');
        } catch (error) {
            console.error('[CacheManager] Error clearing cache:', error);
        }
    }

    /**
     * Invalidate cache for specific keys (when data changes server-side)
     */
    static async invalidate(keys: string[]): Promise<void> {
        try {
            await Promise.all(keys.map(key => this.remove(key)));
            console.log(`[CacheManager] Invalidated: ${keys.join(', ')}`);
        } catch (error) {
            console.error('[CacheManager] Error invalidating cache:', error);
        }
    }

    /**
     * Check if cache version is current
     */
    static async checkVersion(): Promise<boolean> {
        try {
            const storedVersion = await AsyncStorage.getItem(VERSION_KEY);
            if (storedVersion !== CACHE_VERSION) {
                console.log(`[CacheManager] Version upgrade: ${storedVersion} -> ${CACHE_VERSION}`);
                await this.clearAll();
                await AsyncStorage.setItem(VERSION_KEY, CACHE_VERSION);
                return false;
            }
            return true;
        } catch (error) {
            console.error('[CacheManager] Error checking version:', error);
            return true;
        }
    }
}

// Cache keys registry (centralized to avoid typos)
export const CACHE_KEYS = {
    USER: 'user_profile',
    TOKEN: 'auth_token',
    FARMS: 'user_farms',
    WEATHER: 'weather_data',
    FORUMS: 'forum_topics',
    EXPERTS: 'expert_list',
    SUGGESTIONS: 'farm_suggestions'
} as const;
