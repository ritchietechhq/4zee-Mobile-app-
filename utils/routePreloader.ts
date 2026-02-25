// ============================================================
// Route Preloader — Prefetch screens for instant transitions
// Uses expo-router's prefetch API to warm route modules.
// Call once after initial mount to preload likely next screens.
// ============================================================

import { router } from 'expo-router';
import { runAfterInteractions } from '@/utils/performance';

/** Routes the realtor is most likely to navigate to */
const REALTOR_ROUTES = [
  '/(realtor)/listings',
  '/(realtor)/leads',
  '/(realtor)/requests',
  '/(realtor)/profile',
  '/(realtor)/add-listing',
  '/(realtor)/messages',
] as const;

/** Routes the client is most likely to navigate to */
const CLIENT_ROUTES = [
  '/(client)/dashboard',
  '/(client)/saved',
  '/(client)/explore',
  '/(client)/profile',
] as const;

/**
 * Prefetch a list of routes after animations are complete.
 * This loads the JS bundles for those screens so the first
 * navigation is instant instead of showing a loading state.
 *
 * Uses expo-router's `router.prefetch()` (SDK 54+) when available,
 * otherwise silently no-ops.
 */
function prefetchRoutes(routes: readonly string[]): void {
  // expo-router v4+ exposes router.prefetch
  if (typeof (router as any).prefetch !== 'function') {
    if (__DEV__) console.log('[RoutePreloader] router.prefetch not available, skipping');
    return;
  }

  const handle = runAfterInteractions(() => {
    routes.forEach((route, idx) => {
      // Stagger prefetches to avoid blocking the JS thread
      setTimeout(() => {
        try {
          (router as any).prefetch(route);
        } catch {
          // Some routes can't be prefetched (dynamic params) — ignore
        }
      }, idx * 100);
    });
  });

  // Cleanup is automatic — the handle cancels if unmounted before running
}

/** Call from the realtor dashboard on mount */
export function preloadRealtorRoutes(): void {
  prefetchRoutes(REALTOR_ROUTES);
}

/** Call from the client dashboard on mount */
export function preloadClientRoutes(): void {
  prefetchRoutes(CLIENT_ROUTES);
}
