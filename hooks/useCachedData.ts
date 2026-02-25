// ============================================================
// useCachedData Hook
// Provides cached data fetching with automatic background refresh
// Eliminates skeleton loading for returning users
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService, CACHE_KEYS, TTL } from '@/services/cache.service';

type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS] | string;

interface UseCachedDataOptions {
  /** Cache key identifier */
  cacheKey: CacheKey;
  /** Optional suffix for the cache key (e.g., user ID, property ID) */
  suffix?: string;
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Whether to fetch immediately on mount */
  fetchOnMount?: boolean;
  /** Whether to refresh in background when cached data is shown */
  backgroundRefresh?: boolean;
  /** Dependencies that trigger re-fetch when changed */
  deps?: any[];
}

interface UseCachedDataResult<T> {
  /** The data (cached or fresh) */
  data: T | null;
  /** Whether initial load is happening (no cached data available) */
  isLoading: boolean;
  /** Whether a background refresh is in progress */
  isRefreshing: boolean;
  /** Whether the current data is from cache */
  isFromCache: boolean;
  /** Error from the last fetch attempt */
  error: Error | null;
  /** Manual refresh function */
  refresh: (forceRefresh?: boolean) => Promise<void>;
  /** Clear cached data */
  clearCache: () => Promise<void>;
}

export function useCachedData<T>(
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions
): UseCachedDataResult<T> {
  const {
    cacheKey,
    suffix,
    ttl = TTL.MEDIUM,
    fetchOnMount = true,
    backgroundRefresh = true,
    deps = [],
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current && !forceRefresh) return;
    fetchingRef.current = true;

    try {
      // Try to get cached data first
      if (!forceRefresh) {
        const cached = await cacheService.get<T>(cacheKey, suffix);
        if (cached && mountedRef.current) {
          setData(cached);
          setIsFromCache(true);
          setIsLoading(false);
          
          // Background refresh if enabled
          if (backgroundRefresh) {
            setIsRefreshing(true);
            try {
              const freshData = await fetcher();
              if (mountedRef.current) {
                setData(freshData);
                setIsFromCache(false);
                await cacheService.set(cacheKey, freshData, { ttl, suffix });
              }
            } catch (bgError) {
              // Silent fail for background refresh - cached data is still valid
              console.warn('[useCachedData] Background refresh failed:', bgError);
            } finally {
              if (mountedRef.current) {
                setIsRefreshing(false);
              }
            }
          }
          fetchingRef.current = false;
          return;
        }
      }

      // No cache or force refresh - fetch fresh data
      if (mountedRef.current) {
        if (forceRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
      }

      const freshData = await fetcher();
      
      if (mountedRef.current) {
        setData(freshData);
        setIsFromCache(false);
        setError(null);
        await cacheService.set(cacheKey, freshData, { ttl, suffix });
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Try to use stale cache as fallback
        const staleCache = await cacheService.get<T>(cacheKey, suffix);
        if (staleCache) {
          setData(staleCache);
          setIsFromCache(true);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      fetchingRef.current = false;
    }
  }, [cacheKey, suffix, ttl, backgroundRefresh, fetcher]);

  const refresh = useCallback(async (forceRefresh = true) => {
    await loadData(forceRefresh);
  }, [loadData]);

  const clearCache = useCallback(async () => {
    await cacheService.remove(cacheKey, suffix);
    setData(null);
    setIsFromCache(false);
  }, [cacheKey, suffix]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    
    if (fetchOnMount) {
      loadData(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [fetchOnMount, ...deps]);

  return {
    data,
    isLoading,
    isRefreshing,
    isFromCache,
    error,
    refresh,
    clearCache,
  };
}

// ─── Convenience Hooks for Common Data ───────────────────────

export function useCachedDashboard<T>(fetcher: () => Promise<T>, role: 'client' | 'realtor' | 'admin') {
  const keyMap = {
    client: CACHE_KEYS.DASHBOARD,
    realtor: CACHE_KEYS.REALTOR_DASHBOARD,
    admin: CACHE_KEYS.ADMIN_DASHBOARD,
  };
  
  return useCachedData(fetcher, {
    cacheKey: keyMap[role],
    ttl: TTL.SHORT,
    backgroundRefresh: true,
  });
}

export function useCachedProperties<T>(fetcher: () => Promise<T>) {
  return useCachedData(fetcher, {
    cacheKey: CACHE_KEYS.PROPERTIES,
    ttl: TTL.MEDIUM,
    backgroundRefresh: true,
  });
}

export function useCachedConversations<T>(fetcher: () => Promise<T>) {
  return useCachedData(fetcher, {
    cacheKey: CACHE_KEYS.CONVERSATIONS,
    ttl: TTL.SHORT,
    backgroundRefresh: true,
  });
}

export function useCachedProfile<T>(fetcher: () => Promise<T>, userId?: string) {
  return useCachedData(fetcher, {
    cacheKey: CACHE_KEYS.PROFILE,
    suffix: userId,
    ttl: TTL.LONG,
    backgroundRefresh: true,
  });
}
