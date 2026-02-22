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

/** Normalise backend response: handles both plain array and { items, pagination } */
function normalizePaginated<T>(raw: any): PaginatedResponse<T> {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      pagination: { limit: raw.length, hasNext: false, hasPrev: false },
    };
  }
  // Already paginated shape
  if (raw?.items && Array.isArray(raw.items)) {
    return {
      items: raw.items,
      pagination: raw.pagination ?? { limit: raw.items.length, hasNext: false, hasPrev: false },
    };
  }
  // Fallback: unexpected shape
  return { items: [], pagination: { limit: 0, hasNext: false, hasPrev: false } };
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
    return normalizePaginated<Property>(res.data);
  }

  /** GET /properties/:id */
  async getById(id: string): Promise<Property> {
    const res = await api.get<Property>(`/properties/${id}`);
    return res.data!;
  }

  /** GET /properties/featured */
  async getFeatured(limit = 10): Promise<Property[]> {
    const res = await api.get<any>('/properties/featured', { limit });
    const raw = res.data;
    // Could be a plain array or { items: [...] }
    if (Array.isArray(raw)) return raw;
    if (raw?.items && Array.isArray(raw.items)) return raw.items;
    return [];
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
    return normalizePaginated<Property>(res.data);
  }
}

export const propertyService = new PropertyService();
export default propertyService;
