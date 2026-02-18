// ============================================================
// useApplications Hook
// Manages client applications (replaces old useInstallments)
// ============================================================

import { useState, useCallback } from 'react';
import type { Application, PaginatedResponse } from '@/types';
import applicationService from '@/services/application.service';

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedResponse<Application> =
        await applicationService.getMyApplications();
      setApplications(data.items);
      setNextCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasNext);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load applications.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const data = await applicationService.getMyApplications(nextCursor);
      setApplications((prev) => [...prev, ...data.items]);
      setNextCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasNext);
    } catch {
      // Silently fail load-more
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, nextCursor]);

  const fetchApplicationById = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    setError(null);
    try {
      const app = await applicationService.getById(id);
      setSelectedApplication(app);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load application.';
      setError(message);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const createApplication = useCallback(
    async (propertyId: string, realtorId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const app = await applicationService.create({ propertyId, realtorId });
        setApplications((prev) => [app, ...prev]);
        return app;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to create application.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    applications,
    selectedApplication,
    hasMore,
    isLoading,
    isLoadingDetail,
    error,
    fetchApplications,
    loadMore,
    fetchApplicationById,
    createApplication,
    clearError,
  };
}
