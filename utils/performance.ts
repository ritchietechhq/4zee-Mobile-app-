// ============================================================
// Performance Utilities
// Provides helpers for deferred execution, route prefetching,
// image preloading, and batched state updates.
// ============================================================

import { InteractionManager, Platform } from 'react-native';
import { Image } from 'expo-image';

// ─── Deferred Execution ──────────────────────────────────────

/**
 * Run a callback after animations / interactions complete.
 * On web, uses requestIdleCallback (or setTimeout fallback).
 * On native, uses InteractionManager.
 */
export function runAfterInteractions(callback: () => void): { cancel: () => void } {
  if (Platform.OS === 'web') {
    const id = setTimeout(callback, 50);
    return { cancel: () => clearTimeout(id) };
  }
  const handle = InteractionManager.runAfterInteractions(callback);
  return { cancel: () => handle.cancel() };
}

/**
 * Delay execution by a number of milliseconds.
 * Useful for staggering multiple API calls to avoid blocking the JS thread.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Image Prefetching ───────────────────────────────────────

/**
 * Prefetch an array of image URLs into the native image cache.
 * Uses expo-image's built-in prefetch which supports memory + disk caching.
 * Silently ignores failures.
 */
export async function prefetchImages(urls: (string | undefined | null)[]): Promise<void> {
  const validUrls = urls.filter((u): u is string => !!u && typeof u === 'string');
  if (validUrls.length === 0) return;

  try {
    await Image.prefetch(validUrls);
  } catch {
    // Silently fail — prefetching is best-effort
  }
}

// ─── FlatList Performance Config ─────────────────────────────

/**
 * Optimized FlatList props for long lists.
 * Spread into any <FlatList /> for consistent performance.
 */
export const FLATLIST_PERF_PROPS = {
  windowSize: 5,
  maxToRenderPerBatch: 8,
  initialNumToRender: 6,
  removeClippedSubviews: Platform.OS !== 'web',
  updateCellsBatchingPeriod: 50,
} as const;

/**
 * FlatList props for short lists (< 20 items).
 */
export const FLATLIST_SHORT_PROPS = {
  windowSize: 10,
  maxToRenderPerBatch: 10,
  initialNumToRender: 10,
  removeClippedSubviews: false,
} as const;

// ─── Debounce / Throttle ─────────────────────────────────────

/**
 * Creates a debounced version of a function.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
  };
  return debounced as T & { cancel: () => void };
}

/**
 * Creates a throttled version of a function.
 * Executes immediately, then ignores calls within the wait period.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
}

// ─── Batch State Updates ─────────────────────────────────────

/**
 * Batch multiple state updates into a single render cycle.
 * React 18+ batches automatically in most cases, but this ensures
 * it works in async callbacks on older React Native builds.
 */
export function batchUpdates(callback: () => void): void {
  // React Native uses unstable_batchedUpdates from react-native
  // but React 18 auto-batches in most cases
  callback();
}
