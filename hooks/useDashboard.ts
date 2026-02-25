// ============================================================
// useDashboard Hook — with caching for instant loading
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import type { ClientDashboard, RealtorDashboard } from '@/types';
import { dashboardService } from '@/services/dashboard.service';
import { cacheService, CACHE_KEYS, TTL } from '@/services/cache.service';

export function useDashboard() {
  const [clientData, setClientData] = useState<ClientDashboard | null>(null);
  const [realtorData, setRealtorData] = useState<RealtorDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientDashboard = useCallback(async (forceRefresh = false) => {
    setError(null);
    
    // Try cache first for instant display
    if (!forceRefresh) {
      const cached = await cacheService.get<ClientDashboard>(CACHE_KEYS.DASHBOARD);
      if (cached) {
        setClientData(cached);
        setIsFromCache(true);
        // Background refresh
        dashboardService.getClientDashboard().then((data) => {
          setClientData(data);
          setIsFromCache(false);
          cacheService.set(CACHE_KEYS.DASHBOARD, data, { ttl: TTL.SHORT });
        }).catch(() => {});
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const data = await dashboardService.getClientDashboard();
      setClientData(data);
      setIsFromCache(false);
      // Cache the results
      await cacheService.set(CACHE_KEYS.DASHBOARD, data, { ttl: TTL.SHORT });
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to load dashboard.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRealtorDashboard = useCallback(async (forceRefresh = false) => {
    setError(null);
    
    // Try cache first for instant display
    if (!forceRefresh) {
      const cached = await cacheService.get<RealtorDashboard>(CACHE_KEYS.REALTOR_DASHBOARD);
      if (cached) {
        setRealtorData(cached);
        setIsFromCache(true);
        // Background refresh
        dashboardService.getRealtorDashboard().then((data) => {
          setRealtorData(data);
          setIsFromCache(false);
          cacheService.set(CACHE_KEYS.REALTOR_DASHBOARD, data, { ttl: TTL.SHORT });
        }).catch(() => {});
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const data = await dashboardService.getRealtorDashboard();
      setRealtorData(data);
      setIsFromCache(false);
      // Cache the results
      await cacheService.set(CACHE_KEYS.REALTOR_DASHBOARD, data, { ttl: TTL.SHORT });
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to load dashboard.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    clientData,
    realtorData,
    isLoading,
    isFromCache,
    error,
    fetchClientDashboard,
    fetchRealtorDashboard,
  };
}
