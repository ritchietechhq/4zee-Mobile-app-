// ============================================================
// Application Service
// Endpoints: POST /applications, GET /applications/me,
//            GET /applications/:id
// ============================================================

import api from './api';
import type {
  Application,
  CreateApplicationRequest,
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
  if (raw?.items && Array.isArray(raw.items)) {
    return {
      items: raw.items,
      pagination: raw.pagination ?? { limit: raw.items.length, hasNext: false, hasPrev: false },
    };
  }
  return { items: [], pagination: { limit: 0, hasNext: false, hasPrev: false } };
}

class ApplicationService {
  /** POST /applications — idempotent, requires CLIENT role */
  async create(payload: CreateApplicationRequest): Promise<Application> {
    const res = await api.post<Application>('/applications', payload);
    return res.data!;
  }

  /** GET /applications/me — cursor-paginated */
  async getMyApplications(
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResponse<Application>> {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get<any>('/applications/me', params);
    return normalizePaginated<Application>(res.data);
  }

  /** GET /applications/:id */
  async getById(id: string): Promise<Application> {
    const res = await api.get<Application>(`/applications/${id}`);
    return res.data!;
  }
}

export const applicationService = new ApplicationService();
export default applicationService;
