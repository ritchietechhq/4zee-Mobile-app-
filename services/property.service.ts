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
    const res = await api.get<PaginatedResponse<Property>>(
      '/properties/search',
      params,
    );
    return res.data!;
  }

  /** GET /properties/:id */
  async getById(id: string): Promise<Property> {
    const res = await api.get<Property>(`/properties/${id}`);
    return res.data!;
  }

  /** GET /properties/featured */
  async getFeatured(limit = 10): Promise<Property[]> {
    const res = await api.get<Property[]>('/properties/featured', { limit });
    return res.data!;
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
    const res = await api.get<PaginatedResponse<Property>>(
      '/properties',
      params,
    );
    return res.data!;
  }
}

export const propertyService = new PropertyService();
export default propertyService;
