// ============================================================
// Property Service
// Endpoints: GET /properties/search, /properties/:id,
//            /properties/featured, /properties
// ============================================================

import api from './api';
import type {
  Property,
  PropertySearchFilters,
  PaginatedResponse,
} from '@/types';

/**
 * Normalise a single property from the backend.
 * Maps `mediaUrls` → `images` so all UI components can use `property.images`.
 */
function normalizeProperty(raw: any): Property {
  if (!raw) return raw;
  return {
    ...raw,
    images: raw.images?.length ? raw.images : (raw.mediaUrls ?? []),
    amenities: raw.amenities ?? [],
  };
}

/** Normalise backend response: handles both plain array and { items, pagination } */
function normalizePaginated(raw: any): PaginatedResponse<Property> {
  let items: any[] = [];
  let pagination = { limit: 0, hasNext: false, hasPrev: false } as any;

  if (Array.isArray(raw)) {
    items = raw;
    pagination = { limit: raw.length, hasNext: false, hasPrev: false };
  } else if (raw?.items && Array.isArray(raw.items)) {
    items = raw.items;
    pagination = raw.pagination ?? { limit: raw.items.length, hasNext: false, hasPrev: false };
  }

  return {
    items: items.map(normalizeProperty),
    pagination,
  };
}

class PropertyService {
  /** GET /properties/search — cursor-paginated, public endpoint */
  async search(
    filters?: PropertySearchFilters,
  ): Promise<PaginatedResponse<Property>> {
    const params: Record<string, unknown> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
      });
    }
    const res = await api.get<any>('/properties/search', params);
    return normalizePaginated(res.data);
  }

  /** GET /properties/:id */
  async getById(id: string): Promise<Property> {
    const res = await api.get<any>(`/properties/${id}`);
    return normalizeProperty(res.data);
  }

  /** GET /properties/featured */
  async getFeatured(limit = 10): Promise<Property[]> {
    const res = await api.get<any>('/properties/featured', { limit });
    const raw = res.data;
    let arr: any[] = [];
    if (Array.isArray(raw)) arr = raw;
    else if (raw?.items && Array.isArray(raw.items)) arr = raw.items;
    return arr.map(normalizeProperty);
  }

  /** GET /properties — list all (same filters as search) */
  async list(filters?: PropertySearchFilters): Promise<PaginatedResponse<Property>> {
    const params: Record<string, unknown> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
      });
    }
    const res = await api.get<any>('/properties', params);
    return normalizePaginated(res.data);
  }
}

export const propertyService = new PropertyService();
export default propertyService;
