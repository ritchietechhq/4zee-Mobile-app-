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

export interface RealtorDashboardProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  referralCode: string;
  totalSales: number;
  totalRecruits: number;
  kycStatus: string;
  kycVerifiedAt: string | null;
  kycRejectedReason: string | null;
  memberSince: string;
}

export interface RealtorDashboardApplication {
  id: string;
  property: string;
  client: string;
  status: string;
  createdAt: string;
}

export interface RealtorDashboard {
  profile: RealtorDashboardProfile;
  sales: {
    total: number;
    totalValue: number;
  };
  earnings: {
    totalCommissions: number;
    commissionCount: number;
    availableBalance: number;
    totalWithdrawn: number;
  };
  referrals: {
    activeLinks: number;
    totalClicks: number;
    totalConversions: number;
  };
  recentApplications: RealtorDashboardApplication[];
  alerts: {
    unreadNotifications: number;
    unreadMessages: number;
  };
}
