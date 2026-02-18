// ============================================================
// Dashboard Service
// Endpoints: GET /dashboard/client, GET /dashboard/realtor
// ============================================================

import api from './api';
import type { ClientDashboard, RealtorDashboard } from '@/types';

class DashboardService {
  /** GET /dashboard/client */
  async getClientDashboard(): Promise<ClientDashboard> {
    const res = await api.get<ClientDashboard>('/dashboard/client');
    return res.data!;
  }

  /** GET /dashboard/realtor */
  async getRealtorDashboard(): Promise<RealtorDashboard> {
    const res = await api.get<RealtorDashboard>('/dashboard/realtor');
    return res.data!;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
