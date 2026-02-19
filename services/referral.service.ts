// ============================================================
// Referral Service (Realtor)
// Endpoints: GET /my-referrals/stats, GET /my-referrals,
//            POST /my-referrals, GET /my-referrals/:id,
//            PUT /my-referrals/:id, DELETE /my-referrals/:id
// ============================================================

import api from './api';
import type { ReferralInfo, Referral } from '@/types';

class ReferralService {
  /** GET /my-referrals/stats */
  async getMyInfo(): Promise<ReferralInfo> {
    const res = await api.get<ReferralInfo>('/my-referrals/stats');
    return res.data!;
  }

  /** GET /my-referrals */
  async getMyReferrals(): Promise<Referral[]> {
    const res = await api.get<Referral[]>('/my-referrals');
    return res.data!;
  }

  /** POST /my-referrals — create referral link */
  async create(payload?: { name?: string }): Promise<Referral> {
    const res = await api.post<Referral>('/my-referrals', payload);
    return res.data!;
  }

  /** PUT /my-referrals/:id — update referral link */
  async update(id: string, payload: { name?: string }): Promise<Referral> {
    const res = await api.put<Referral>(`/my-referrals/${id}`, payload);
    return res.data!;
  }

  /** DELETE /my-referrals/:id — delete referral link */
  async remove(id: string): Promise<void> {
    await api.delete(`/my-referrals/${id}`);
  }
}

export const referralService = new ReferralService();
export default referralService;
