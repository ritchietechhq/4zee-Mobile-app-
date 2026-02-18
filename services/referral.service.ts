// ============================================================
// Referral Service (Realtor)
// Endpoints: GET /referrals/my-info, GET /referrals/my-referrals
// ============================================================

import api from './api';
import type { ReferralInfo, Referral } from '@/types';

class ReferralService {
  /** GET /referrals/my-info */
  async getMyInfo(): Promise<ReferralInfo> {
    const res = await api.get<ReferralInfo>('/referrals/my-info');
    return res.data!;
  }

  /** GET /referrals/my-referrals */
  async getMyReferrals(): Promise<Referral[]> {
    const res = await api.get<Referral[]>('/referrals/my-referrals');
    return res.data!;
  }
}

export const referralService = new ReferralService();
export default referralService;
