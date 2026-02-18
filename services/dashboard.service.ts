// ============================================================
// Dashboard Service
// Endpoints: GET /dashboard/client, GET /dashboard/realtor
// ============================================================

import api from './api';
import type { ClientDashboard, RealtorDashboard } from '@/types';

class DashboardService {
  /** GET /dashboard/client */
  async getClientDashboard(): Promise<ClientDashboard> {
    const res = await api.get<any>('/dashboard/client');
    const raw = res.data ?? {};
    // Normalize — provide safe defaults so UI never crashes on missing fields
    return {
      profile: raw.profile ?? { email: '', firstName: '', lastName: '', kycStatus: 'NOT_SUBMITTED', memberSince: '' },
      applicationsSummary: raw.applicationsSummary ?? { PENDING: 0, APPROVED: 0, REJECTED: 0, total: 0 },
      financials: raw.financials ?? { totalSpent: 0, activePaymentPlans: 0 },
      upcomingInstallments: raw.upcomingInstallments ?? [],
      recentPayments: raw.recentPayments ?? [],
      kycDocuments: raw.kycDocuments ?? [],
      unreadNotifications: raw.unreadNotifications ?? 0,
      unreadMessages: raw.unreadMessages ?? 0,
    };
  }

  /** GET /dashboard/realtor */
  async getRealtorDashboard(): Promise<RealtorDashboard> {
    const res = await api.get<RealtorDashboard>('/dashboard/realtor');
    return res.data!;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
