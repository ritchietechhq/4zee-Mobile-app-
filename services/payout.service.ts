// ============================================================
// Payout Service (Realtor)
// Endpoints: GET /payouts/history, POST /payouts/request,
//            GET /payouts/balance, GET /payouts/summary,
//            PUT /payouts/:id/cancel
// ============================================================

import api from './api';
import type {
  Payout,
  RequestPayoutRequest,
  PayoutBalance,
  PaginatedResponse,
} from '@/types';

class PayoutService {
  /** GET /payouts/history — paginated */
  async getMyPayouts(
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResponse<Payout>> {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get<PaginatedResponse<Payout>>(
      '/payouts/history',
      params,
    );
    return res.data!;
  }

  /** POST /payouts/request — idempotent */
  async request(payload: RequestPayoutRequest): Promise<Payout> {
    const res = await api.post<Payout>('/payouts/request', payload);
    return res.data!;
  }

  /** GET /payouts/balance */
  async getBalance(): Promise<PayoutBalance> {
    const res = await api.get<PayoutBalance>('/payouts/balance');
    return res.data!;
  }

  /** GET /payouts/summary */
  async getSummary(): Promise<any> {
    const res = await api.get<any>('/payouts/summary');
    return res.data!;
  }

  /** PUT /payouts/:id/cancel */
  async cancel(payoutId: string): Promise<void> {
    await api.put(`/payouts/${payoutId}/cancel`);
  }
}

export const payoutService = new PayoutService();
export default payoutService;
