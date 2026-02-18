// ============================================================
// Dashboard Types
// Matches: GET /dashboard/client, GET /dashboard/realtor
// ============================================================

export interface ClientDashboard {
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  purchases: {
    total: number;
    totalAmount: number;
  };
  recentApplications: Array<{
    id: string;
    status: string;
    property: {
      title: string;
      price: number;
      images: string[];
    };
    createdAt: string;
  }>;
  featuredProperties: Array<import('./property').Property>;
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
