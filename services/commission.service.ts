// ============================================================
// Commission Service (Realtor)
// Endpoints: GET /commissions/me, GET /commissions/summary,
//            GET /commissions/:id
// ============================================================

import api from './api';
import type {
  Commission,
  CommissionSummary,
  CommissionStatus,
  PaginatedResponse,
} from '@/types';

class CommissionService {
  /** GET /commissions/me — paginated */
  async getMyCommissions(
    status?: CommissionStatus,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResponse<Commission>> {
    const params: Record<string, unknown> = { limit };
    if (status) params.status = status;
    if (cursor) params.cursor = cursor;
    const res = await api.get<PaginatedResponse<Commission>>(
      '/commissions/me',
      params,
    );
    return res.data!;
  }

  /** GET /commissions/summary */
  async getMySummary(): Promise<CommissionSummary> {
    const res = await api.get<CommissionSummary>('/commissions/summary');
    return res.data!;
  }

  /** GET /commissions/:id */
  async getById(id: string): Promise<Commission> {
    const res = await api.get<Commission>(`/commissions/${id}`);
    return res.data!;
  }
}

export const commissionService = new CommissionService();
export default commissionService;
