// ============================================================
// Dashboard Service
// Endpoints: GET /dashboard/client, GET /dashboard/realtor
// ============================================================

import api from './api';
import { normaliseKYCStatus } from '@/utils/kycStatus';
import type { ClientDashboard, RealtorDashboard } from '@/types';

class DashboardService {
  /** GET /dashboard/client */
  async getClientDashboard(): Promise<ClientDashboard> {
    const res = await api.get<any>('/dashboard/client');
    const raw = res.data ?? {};
    // Normalize — provide safe defaults so UI never crashes on missing fields
    return {
      profile: raw.profile
        ? { ...raw.profile, kycStatus: normaliseKYCStatus(raw.profile.kycStatus) }
        : { email: '', firstName: '', lastName: '', kycStatus: 'NOT_SUBMITTED', memberSince: '' },
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
    const res = await api.get<any>('/dashboard/realtor');
    const raw = res.data ?? {};
    // Normalize — provide safe defaults so UI never crashes on missing fields
    return {
      profile: {
        email: raw.profile?.email ?? '',
        firstName: raw.profile?.firstName ?? null,
        lastName: raw.profile?.lastName ?? null,
        phone: raw.profile?.phone ?? null,
        address: raw.profile?.address ?? null,
        referralCode: raw.profile?.referralCode ?? '',
        totalSales: raw.profile?.totalSales ?? 0,
        totalRecruits: raw.profile?.totalRecruits ?? 0,
        kycStatus: normaliseKYCStatus(raw.profile?.kycStatus),
        kycVerifiedAt: raw.profile?.kycVerifiedAt ?? null,
        kycRejectedReason: raw.profile?.kycRejectedReason ?? null,
        memberSince: raw.profile?.memberSince ?? '',
      },
      sales: {
        total: raw.sales?.total ?? 0,
        totalValue: raw.sales?.totalValue ?? 0,
      },
      earnings: {
        totalCommissions: raw.earnings?.totalCommissions ?? 0,
        commissionCount: raw.earnings?.commissionCount ?? 0,
        availableBalance: raw.earnings?.availableBalance ?? 0,
        totalWithdrawn: raw.earnings?.totalWithdrawn ?? 0,
      },
      referrals: {
        activeLinks: raw.referrals?.activeLinks ?? 0,
        totalClicks: raw.referrals?.totalClicks ?? 0,
        totalConversions: raw.referrals?.totalConversions ?? 0,
      },
      recentApplications: raw.recentApplications ?? [],
      alerts: {
        unreadNotifications: raw.alerts?.unreadNotifications ?? 0,
        unreadMessages: raw.alerts?.unreadMessages ?? 0,
      },
    };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
