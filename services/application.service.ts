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
    const res = await api.get<PaginatedResponse<Application>>(
      '/applications/me',
      params,
    );
    return res.data!;
  }

  /** GET /applications/:id */
  async getById(id: string): Promise<Application> {
    const res = await api.get<Application>(`/applications/${id}`);
    return res.data!;
  }
}

export const applicationService = new ApplicationService();
export default applicationService;
