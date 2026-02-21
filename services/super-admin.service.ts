// ============================================================
// Super Admin Service — SUPER_ADMIN exclusive endpoints
// ============================================================

import api from './api';
import type {
  SuperAdminUser,
  SuperAdminUserDetail,
  ChangeUserRoleRequest,
  ChangeUserRoleResponse,
  SuperAdminStats,
  SuperAdminListParams,
  SuperAdminRealtorListParams,
  SuperAdminClientListParams,
} from '@/types/admin';
import type { PaginatedResponse } from '@/types';

class SuperAdminService {
  // ─── User Management (All Users) ──────────────────────────
  async getUsers(
    params?: SuperAdminListParams,
  ): Promise<PaginatedResponse<SuperAdminUser>> {
    const res = await api.get<PaginatedResponse<SuperAdminUser>>(
      '/super-admin/users',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async getUserDetail(userId: string): Promise<SuperAdminUserDetail> {
    const res = await api.get<SuperAdminUserDetail>(`/super-admin/users/${userId}`);
    return res.data!;
  }

  async changeUserRole(
    userId: string,
    data: ChangeUserRoleRequest,
  ): Promise<ChangeUserRoleResponse> {
    const res = await api.patch<ChangeUserRoleResponse>(
      `/super-admin/users/${userId}/role`,
      data,
    );
    return res.data!;
  }

  async deactivateUser(userId: string): Promise<{ message: string }> {
    const res = await api.patch<{ message: string }>(
      `/super-admin/users/${userId}/deactivate`,
    );
    return res.data!;
  }

  async reactivateUser(userId: string): Promise<{ message: string }> {
    const res = await api.patch<{ message: string }>(
      `/super-admin/users/${userId}/reactivate`,
    );
    return res.data!;
  }

  // ─── Admin Accounts ───────────────────────────────────────
  async getAdmins(
    params?: { page?: number; limit?: number; search?: string },
  ): Promise<PaginatedResponse<SuperAdminUser>> {
    const res = await api.get<PaginatedResponse<SuperAdminUser>>(
      '/super-admin/admins',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  // ─── System-wide Stats ────────────────────────────────────
  async getStats(): Promise<SuperAdminStats> {
    const res = await api.get<SuperAdminStats>('/super-admin/system-stats');
    return res.data!;
  }

  // ─── Realtors List ────────────────────────────────────────
  async getRealtors(
    params?: SuperAdminRealtorListParams,
  ): Promise<PaginatedResponse<SuperAdminUser>> {
    const res = await api.get<PaginatedResponse<SuperAdminUser>>(
      '/super-admin/realtors',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  // ─── Clients List ─────────────────────────────────────────
  async getClients(
    params?: SuperAdminClientListParams,
  ): Promise<PaginatedResponse<SuperAdminUser>> {
    const res = await api.get<PaginatedResponse<SuperAdminUser>>(
      '/super-admin/clients',
      params as Record<string, unknown>,
    );
    return res.data!;
  }
}

export const superAdminService = new SuperAdminService();
export default superAdminService;
