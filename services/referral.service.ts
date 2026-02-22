// ============================================================
// Referral Service (Realtor)
// Endpoints: GET /referrals/my-info, GET /referrals/my-referrals,
//            POST /referrals, GET /referrals/:id,
//            PUT /referrals/:id, DELETE /referrals/:id
// ============================================================

import api from './api';
import type { ReferralInfo, Referral } from '@/types';

class ReferralService {
  /**
   * GET /referrals/my-info — realtor's referral code, link & aggregated stats.
   * Normalises whatever shape the backend returns into our ReferralInfo type.
   */
  async getMyInfo(): Promise<ReferralInfo> {
    const res = await api.get<any>('/referrals/my-info');
    const raw = res.data ?? {};
    return {
      referralCode: raw.referralCode ?? raw.code ?? '',
      referralLink: raw.referralLink ?? raw.link ?? '',
      totalReferrals: raw.totalReferrals ?? raw.totalLinks ?? 0,
      activeReferrals: raw.activeReferrals ?? raw.activeLinks ?? 0,
      totalReferralEarnings: raw.totalReferralEarnings ?? raw.referralEarnings ?? raw.totalEarnings ?? 0,
    };
  }

  /**
   * GET /referrals/my-referrals — list of people the realtor has referred.
   * Normalises each item so the UI always gets a consistent Referral shape.
   */
  async getMyReferrals(): Promise<Referral[]> {
    const res = await api.get<any>('/referrals/my-referrals');
    const list: any[] = Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.referrals ?? [];
    return list.map((r: any) => ({
      id: r.id ?? '',
      user: {
        firstName: r.user?.firstName ?? r.firstName ?? '',
        lastName: r.user?.lastName ?? r.lastName ?? '',
        email: r.user?.email ?? r.email ?? '',
      },
      totalSales: r.totalSales ?? 0,
      totalSalesAmount: r.totalSalesAmount ?? 0,
      yourEarnings: r.yourEarnings ?? r.earnings ?? 0,
      joinedAt: r.joinedAt ?? r.createdAt ?? '',
    }));
  }

  /** POST /referrals — create referral link / campaign */
  async create(payload?: { name?: string; description?: string; propertyId?: string }): Promise<Referral> {
    const res = await api.post<Referral>('/referrals', payload);
    return res.data!;
  }

  /** PUT /referrals/:id — update referral link */
  async update(id: string, payload: { name?: string }): Promise<Referral> {
    const res = await api.put<Referral>(`/referrals/${id}`, payload);
    return res.data!;
  }

  /** DELETE /referrals/:id — delete referral link */
  async remove(id: string): Promise<void> {
    await api.delete(`/referrals/${id}`);
  }
}

export const referralService = new ReferralService();
export default referralService;
