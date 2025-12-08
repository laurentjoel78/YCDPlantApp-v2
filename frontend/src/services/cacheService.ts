/**
 * Simple in-memory cache service with TTL support.
 * Helps reduce loading spinners by caching API responses.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class CacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL = 5 * 60 * 1000; // 5 minutes default

    /**
     * Get cached data if available and not expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            // Expired, remove from cache
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Store data in cache with optional TTL
     */
    set<T>(key: string, data: T, ttlMs?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMs ?? this.defaultTTL,
        });
    }

    /**
     * Check if cache entry exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidate all keys matching a prefix
     */
    invalidatePrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
    }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key constants for consistency
export const CACHE_KEYS = {
    PRODUCTS: 'products',
    EXPERTS: 'experts',
    FORUMS: 'forums',
    WEATHER: 'weather',
    SUGGESTIONS: 'suggestions',
    ADMIN_PRODUCTS: 'admin:products',
    ADMIN_EXPERTS: 'admin:experts',
    ADMIN_FORUMS: 'admin:forums',
};
