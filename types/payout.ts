// ============================================================
// Payout Types (Realtor)
// Matches: GET /payouts/me, POST /payouts, GET /payouts/balance
// ============================================================

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Payout {
  id: string;
  amount: number;
  status: PayoutStatus;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName?: string;
  };
  processedAt?: string;
  createdAt: string;
}

export interface RequestPayoutRequest {
  amount: number;
  bankAccountId?: string;
}

export interface PayoutBalance {
  availableBalance: number;
  pendingPayouts: number;
  totalEarned: number;
  totalPaidOut: number;
}
