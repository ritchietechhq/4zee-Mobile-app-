// ============================================================
// Property Store — Zustand
// Cursor-paginated search, detail, featured
// ============================================================

import { create } from 'zustand';
import type { Property, PropertySearchFilters } from '@/types';
import propertyService from '@/services/property.service';

interface PropertyState {
  // Search results
  properties: Property[];
  nextCursor: string | undefined;
  hasMore: boolean;
  filters: PropertySearchFilters;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Featured
  featured: Property[];
  isLoadingFeatured: boolean;

  // Selected property detail
  selectedProperty: Property | null;
  isLoadingDetail: boolean;

  // Actions
  searchProperties: (filters?: PropertySearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: Partial<PropertySearchFilters>) => void;
  resetFilters: () => void;

  fetchPropertyById: (id: string) => Promise<void>;
  clearSelectedProperty: () => void;

  fetchFeatured: (limit?: number) => Promise<void>;

  clearError: () => void;
}

const DEFAULT_FILTERS: PropertySearchFilters = {
  limit: 20,
};

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  nextCursor: undefined,
  hasMore: false,
  filters: { ...DEFAULT_FILTERS },
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,

  featured: [],
  isLoadingFeatured: false,

  selectedProperty: null,
  isLoadingDetail: false,

  searchProperties: async (filters?: PropertySearchFilters) => {
    const currentFilters = filters || get().filters;
    set({
      isLoading: true,
      error: null,
      filters: currentFilters,
    });
    try {
      const result = await propertyService.search({
        ...currentFilters,
        cursor: undefined, // fresh search
      });
      set({
        properties: result.items,
        nextCursor: result.pagination.nextCursor,
        hasMore: result.pagination.hasNext,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load properties.';
      set({ isLoading: false, error: message });
    }
  },

  loadMore: async () => {
    const { hasMore, isLoadingMore, nextCursor, filters } = get();
    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    try {
      const result = await propertyService.search({
        ...filters,
        cursor: nextCursor,
      });
      set((state) => ({
        properties: [...state.properties, ...result.items],
        nextCursor: result.pagination.nextCursor,
        hasMore: result.pagination.hasNext,
        isLoadingMore: false,
      }));
    } catch {
      set({ isLoadingMore: false });
    }
  },

  refresh: async () => {
    const { filters } = get();
    set({ isRefreshing: true });
    try {
      const result = await propertyService.search({
        ...filters,
        cursor: undefined,
      });
      set({
        properties: result.items,
        nextCursor: result.pagination.nextCursor,
        hasMore: result.pagination.hasNext,
        isRefreshing: false,
      });
    } catch {
      set({ isRefreshing: false });
    }
  },

  setFilters: (filters: Partial<PropertySearchFilters>) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  fetchPropertyById: async (id: string) => {
    set({ isLoadingDetail: true, error: null });
    try {
      const property = await propertyService.getById(id);
      set({ selectedProperty: property, isLoadingDetail: false });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load property.';
      set({ isLoadingDetail: false, error: message });
    }
  },

  clearSelectedProperty: () => set({ selectedProperty: null }),

  fetchFeatured: async (limit = 10) => {
    set({ isLoadingFeatured: true });
    try {
      const data = await propertyService.getFeatured(limit);
      set({ featured: data, isLoadingFeatured: false });
    } catch {
      set({ isLoadingFeatured: false });
    }
  },

  clearError: () => set({ error: null }),
}));
