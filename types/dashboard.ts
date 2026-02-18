// ============================================================
// Dashboard Types
// Matches: GET /dashboard/client, GET /dashboard/realtor
// ============================================================

export interface ClientDashboard {
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    kycStatus: string;
    memberSince: string;
  };
  applicationsSummary: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
    total: number;
  };
  financials: {
    totalSpent: number;
    activePaymentPlans: number;
  };
  upcomingInstallments: Array<Record<string, unknown>>;
  recentPayments: Array<Record<string, unknown>>;
  kycDocuments: Array<Record<string, unknown>>;
  unreadNotifications: number;
  unreadMessages: number;
}

export interface RealtorDashboard {
  sales: {
    total: number;
    thisMonth: number;
    totalAmount: number;
  };
  commissions: {
    pending: number;
    approved: number;
    paid: number;
    total: number;
  };
  referrals: {
    total: number;
    active: number;
    earnings: number;
  };
  recentSales: Array<Record<string, unknown>>;
  performanceChart: {
    labels: string[];
    data: number[];
  };
}
