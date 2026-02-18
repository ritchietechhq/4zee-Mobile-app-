// ============================================================
// Referral Types (Realtor)
// Matches: GET /referrals/my-info, GET /referrals/my-referrals
// ============================================================

export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalReferralEarnings: number;
}

export interface Referral {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  totalSales: number;
  totalSalesAmount: number;
  yourEarnings: number;
  joinedAt: string;
}
