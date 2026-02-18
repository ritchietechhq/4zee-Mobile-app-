// ============================================================
// Payout Service (Realtor)
// Endpoints: GET /payouts/me, POST /payouts, GET /payouts/balance
// ============================================================

import api from './api';
import type {
  Payout,
  RequestPayoutRequest,
  PayoutBalance,
  PaginatedResponse,
} from '@/types';

class PayoutService {
  /** GET /payouts/me — cursor-paginated */
  async getMyPayouts(
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResponse<Payout>> {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get<PaginatedResponse<Payout>>(
      '/payouts/me',
      params,
    );
    return res.data!;
  }

  /** POST /payouts — idempotent */
  async request(payload: RequestPayoutRequest): Promise<Payout> {
    const res = await api.post<Payout>('/payouts', payload);
    return res.data!;
  }

  /** GET /payouts/balance */
  async getBalance(): Promise<PayoutBalance> {
    const res = await api.get<PayoutBalance>('/payouts/balance');
    return res.data!;
  }
}

export const payoutService = new PayoutService();
export default payoutService;
