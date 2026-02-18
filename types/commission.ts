// ============================================================
// Commission Types (Realtor)
// Matches: GET /commissions/my-commissions, /commissions/my-summary, etc.
// ============================================================

export type CommissionType = 'DIRECT' | 'REFERRAL';
export type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface CommissionSale {
  id: string;
  amount: number;
  property: {
    title: string;
  };
  client?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface Commission {
  id: string;
  amount: number;
  rate: number;
  type: CommissionType;
  status: CommissionStatus;
  sale: CommissionSale;
  createdAt: string;
}

export interface CommissionSummary {
  pending: { count: number; amount: number };
  approved: { count: number; amount: number };
  paid: { count: number; amount: number };
  total: { count: number; amount: number };
}
