// ============================================================
// Payout Types (Realtor)
// Matches: GET /payouts/me, POST /payouts, GET /payouts/balance
// ============================================================

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Payout {
  id: string;
  amount: number;
  status: PayoutStatus;
  reference?: string;
  failureReason?: string | null;
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
  notes?: string;
}

export interface PayoutBalance {
  availableBalance: number;
  totalWithdrawn: number;
  pendingWithdrawals: {
    count: number;
    amount: number;
  };
}
