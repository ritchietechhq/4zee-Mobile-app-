// ============================================================
// Cache Service — App-Wide Data Caching with AsyncStorage
// Provides persistent caching to eliminate skeleton loading
// for returning users with cached data
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Cache Configuration ─────────────────────────────────────

const CACHE_PREFIX = '4zee_cache_';
const CACHE_METADATA_KEY = '4zee_cache_metadata';

// Default TTL values (in milliseconds)
const TTL = {
  SHORT: 5 * 60 * 1000,        // 5 minutes - for frequently changing data
  MEDIUM: 30 * 60 * 1000,      // 30 minutes - for semi-static data
  LONG: 2 * 60 * 60 * 1000,    // 2 hours - for rarely changing data
  DAY: 24 * 60 * 60 * 1000,    // 24 hours - for static data
  WEEK: 7 * 24 * 60 * 60 * 1000, // 1 week - for very static data
} as const;

// Cache keys for different data types
export const CACHE_KEYS = {
  // Client
  DASHBOARD: 'dashboard',
  PROPERTIES: 'properties',
  FEATURED_PROPERTIES: 'featured_properties',
  SAVED_PROPERTIES: 'saved_properties',
  CONVERSATIONS: 'conversations',
  PAYMENTS: 'payments',
  PROFILE: 'profile',
  NOTIFICATIONS: 'notifications',
  
  // Realtor
  REALTOR_DASHBOARD: 'realtor_dashboard',
  REALTOR_LISTINGS: 'realtor_listings',
  REALTOR_LEADS: 'realtor_leads',
  REALTOR_COMMISSIONS: 'realtor_commissions',
  REALTOR_REQUESTS: 'realtor_requests',
  
  // Admin
  ADMIN_DASHBOARD: 'admin_dashboard',
  ADMIN_KYC: 'admin_kyc',
  ADMIN_USERS: 'admin_users',
  ADMIN_PROPERTIES: 'admin_properties',
  ADMIN_PAYMENTS: 'admin_payments',
  
  // Shared
  PROPERTY_DETAIL: 'property_detail',
  USER_PROFILE: 'user_profile',
} as const;

type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS] | string;

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheMetadata {
  lastCleared: number;
  version: string;
}

const CACHE_VERSION = '1.0.0';

// ─── In-Memory Cache Layer ───────────────────────────────────
// Provides instant access for frequently used data

const memoryCache = new Map<string, CacheEntry>();
const MAX_MEMORY_ITEMS = 50;

// ─── Cache Service ───────────────────────────────────────────

class CacheService {
  private initialized = false;

  /**
   * Initialize cache service - call on app startup
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check cache version and clear if outdated
      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (metadataStr) {
        const metadata: CacheMetadata = JSON.parse(metadataStr);
        if (metadata.version !== CACHE_VERSION) {
          await this.clearAll();
        }
      }
      
      // Set metadata
      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify({
        lastCleared: Date.now(),
        version: CACHE_VERSION,
      }));
      
      this.initialized = true;
    } catch (error) {
      console.warn('[Cache] Init error:', error);
      this.initialized = true;
    }
  }

  /**
   * Generate cache key with prefix
   */
  private getKey(key: CacheKey, suffix?: string): string {
    return `${CACHE_PREFIX}${key}${suffix ? `_${suffix}` : ''}`;
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get data from cache (memory first, then storage)
   */
  async get<T>(key: CacheKey, suffix?: string): Promise<T | null> {
    const fullKey = this.getKey(key, suffix);

    // Check memory cache first
    const memEntry = memoryCache.get(fullKey);
    if (memEntry && this.isValid(memEntry)) {
      return memEntry.data as T;
    }

    // Check AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(fullKey);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.setMemory(fullKey, entry);
          return entry.data;
        }
        // Clean up expired entry
        await AsyncStorage.removeItem(fullKey);
      }
    } catch (error) {
      console.warn('[Cache] Get error:', error);
    }

    return null;
  }

  /**
   * Set data in cache (both memory and storage)
   */
  async set<T>(
    key: CacheKey,
    data: T,
    options?: { ttl?: number; suffix?: string }
  ): Promise<void> {
    const fullKey = this.getKey(key, options?.suffix);
    const ttl = options?.ttl ?? TTL.MEDIUM;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Set in memory
    this.setMemory(fullKey, entry);

    // Set in AsyncStorage
    try {
      await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('[Cache] Set error:', error);
    }
  }

  /**
   * Set in memory cache with LRU eviction
   */
  private setMemory(key: string, entry: CacheEntry): void {
    // Evict oldest if at capacity
    if (memoryCache.size >= MAX_MEMORY_ITEMS) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(key, entry);
  }

  /**
   * Remove specific cache entry
   */
  async remove(key: CacheKey, suffix?: string): Promise<void> {
    const fullKey = this.getKey(key, suffix);
    memoryCache.delete(fullKey);
    try {
      await AsyncStorage.removeItem(fullKey);
    } catch (error) {
      console.warn('[Cache] Remove error:', error);
    }
  }

  /**
   * Remove all cache entries matching a key pattern
   */
  async removeByPattern(keyPattern: CacheKey): Promise<void> {
    const pattern = `${CACHE_PREFIX}${keyPattern}`;
    
    // Clear from memory
    for (const key of memoryCache.keys()) {
      if (key.startsWith(pattern)) {
        memoryCache.delete(key);
      }
    }

    // Clear from storage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const matchingKeys = allKeys.filter(k => k.startsWith(pattern));
      if (matchingKeys.length > 0) {
        await AsyncStorage.multiRemove(matchingKeys);
      }
    } catch (error) {
      console.warn('[Cache] RemoveByPattern error:', error);
    }
  }

  /**
   * Clear all app cache
   */
  async clearAll(): Promise<void> {
    memoryCache.clear();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(k => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('[Cache] ClearAll error:', error);
    }
  }

  /**
   * Get with fallback - returns cached data immediately while fetching fresh data
   * Returns { data, isFromCache, refresh }
   */
  async getWithFallback<T>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    options?: { ttl?: number; suffix?: string; forceRefresh?: boolean }
  ): Promise<{
    data: T | null;
    isFromCache: boolean;
    refresh: () => Promise<T>;
  }> {
    const cached = options?.forceRefresh ? null : await this.get<T>(key, options?.suffix);

    const refresh = async (): Promise<T> => {
      const freshData = await fetcher();
      await this.set(key, freshData, { ttl: options?.ttl, suffix: options?.suffix });
      return freshData;
    };

    if (cached !== null) {
      return { data: cached, isFromCache: true, refresh };
    }

    try {
      const data = await refresh();
      return { data, isFromCache: false, refresh };
    } catch (error) {
      return { data: null, isFromCache: false, refresh };
    }
  }

  /**
   * Preload essential data for a user role
   */
  async preloadForRole(
    role: 'CLIENT' | 'REALTOR' | 'ADMIN',
    fetchers: Record<string, () => Promise<any>>
  ): Promise<void> {
    const promises = Object.entries(fetchers).map(async ([key, fetcher]) => {
      try {
        const data = await fetcher();
        await this.set(key as CacheKey, data, { ttl: TTL.MEDIUM });
      } catch (error) {
        console.warn(`[Cache] Preload ${key} failed:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Invalidate user-specific cache on logout
   */
  async onLogout(): Promise<void> {
    await this.clearAll();
    memoryCache.clear();
  }

  /**
   * Invalidate cache when data is mutated
   */
  async invalidate(...keys: CacheKey[]): Promise<void> {
    await Promise.all(keys.map(key => this.removeByPattern(key)));
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export TTL constants for custom usage
export { TTL };
