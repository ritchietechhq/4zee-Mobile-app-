// ============================================================
// useDashboard Hook
// ============================================================

import { useState, useCallback } from 'react';
import type { ClientDashboard, RealtorDashboard } from '@/types';
import { dashboardService } from '@/services/dashboard.service';

export function useDashboard() {
  const [clientData, setClientData] = useState<ClientDashboard | null>(null);
  const [realtorData, setRealtorData] = useState<RealtorDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getClientDashboard();
      setClientData(data);
    } catch (err: unknown) {
      const message =
        (err as { error?: { message?: string } })?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to load dashboard.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRealtorDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getRealtorDashboard();
      setRealtorData(data);
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
    error,
    fetchClientDashboard,
    fetchRealtorDashboard,
  };
}
