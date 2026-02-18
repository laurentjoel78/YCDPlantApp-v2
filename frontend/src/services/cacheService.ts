/**
 * Optimized cache service with MMKV persistence.
 * Longer TTLs for poor connectivity (Cameroon).
 * Data persists across app restarts.
 */

import { StorageHelpers } from '../utils/storage';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

// Cache TTL constants (in milliseconds) - optimized for poor connectivity
export const CACHE_TTL = {
    SHORT: 10 * 60 * 1000,      // 10 minutes - weather
    MEDIUM: 30 * 60 * 1000,     // 30 minutes - forums
    LONG: 2 * 60 * 60 * 1000,   // 2 hours - products, experts
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours - user data, crops
};

class CacheService {
    private memoryCache: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL = CACHE_TTL.MEDIUM; // 30 minutes default

    /**
     * Get cached data - checks memory first, then MMKV
     * Returns stale data if available (better UX for offline)
     */
    get<T>(key: string, allowStale: boolean = false): T | null {
        // Check memory cache first (fastest)
        const memEntry = this.memoryCache.get(key);
        if (memEntry) {
            const now = Date.now();
            const isExpired = now - memEntry.timestamp > memEntry.ttl;
            
            if (!isExpired) {
                return memEntry.data as T;
            }
            
            // Return stale data if allowed (offline-friendly)
            if (allowStale) {
                console.log(`[Cache] Returning stale data for ${key}`);
                return memEntry.data as T;
            }
            
            this.memoryCache.delete(key);
        }

        // Check persistent storage (MMKV)
        const stored = StorageHelpers.getObject<CacheEntry<T>>(`cache:${key}`);
        if (stored) {
            const now = Date.now();
            const isExpired = now - stored.timestamp > stored.ttl;
            
            // Restore to memory cache
            this.memoryCache.set(key, stored);
            
            if (!isExpired) {
                return stored.data;
            }
            
            // Return stale data if allowed
            if (allowStale) {
                console.log(`[Cache] Returning stale MMKV data for ${key}`);
                return stored.data;
            }
        }

        return null;
    }

    /**
     * Store data in both memory and MMKV (persistent)
     */
    set<T>(key: string, data: T, ttlMs?: number): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttlMs ?? this.defaultTTL,
        };
        
        // Store in memory (fast access)
        this.memoryCache.set(key, entry);
        
        // Persist to MMKV (survives app restart)
        StorageHelpers.setObject(`cache:${key}`, entry);
    }

    /**
     * Check if cache entry exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Get or fetch pattern - returns cached data or fetches fresh
     * With stale-while-revalidate behavior
     */
    async getOrFetch<T>(
        key: string, 
        fetchFn: () => Promise<T>, 
        ttlMs?: number,
        options?: { allowStale?: boolean }
    ): Promise<T> {
        const cached = this.get<T>(key, options?.allowStale);
        
        if (cached !== null) {
            // If data is stale, refresh in background
            const entry = this.memoryCache.get(key);
            if (entry && Date.now() - entry.timestamp > entry.ttl) {
                // Fire and forget - background refresh
                fetchFn().then(data => this.set(key, data, ttlMs)).catch(() => {});
            }
            return cached;
        }

        // No cache, must fetch
        const data = await fetchFn();
        this.set(key, data, ttlMs);
        return data;
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        this.memoryCache.delete(key);
        StorageHelpers.remove(`cache:${key}`);
    }

    /**
     * Invalidate all keys matching a prefix
     */
    invalidatePrefix(prefix: string): void {
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefix)) {
                this.memoryCache.delete(key);
                StorageHelpers.remove(`cache:${key}`);
            }
        }
    }

    /**
     * Clear entire cache (memory + persistent)
     */
    clear(): void {
        // Clear memory
        for (const key of this.memoryCache.keys()) {
            StorageHelpers.remove(`cache:${key}`);
        }
        this.memoryCache.clear();
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
    CROPS: 'crops',
    MARKETS: 'markets',
    ADMIN_PRODUCTS: 'admin:products',
    ADMIN_EXPERTS: 'admin:experts',
    ADMIN_FORUMS: 'admin:forums',
};
