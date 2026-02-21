// ============================================================
// Admin Service — All 89 Admin Endpoints
// Matches: docs/ADMIN_PANEL_IMPLEMENTATION.md
// ============================================================

import api from './api';
import type {
  AdminDashboard,
  AdminQuickStats,
  CreateUserRequest,
  CreateUserResponse,
  AdminKYCPendingResponse,
  AdminKYCClientDetail,
  VerifyKYCDocumentRequest,
  AdminKYCStatistics,
  AdminApplication,
  AdminSale,
  RecordOfflineSaleRequest,
  PaymentPlanTemplate,
  CreatePaymentPlanTemplateRequest,
  PaymentPlanEnrollment,
  EnrollApplicationRequest,
  OverdueInstallment,
  PaymentPlanStatistics,
  CommissionRates,
  AdminCommission,
  MonthlyCommissionReport,
  RealtorCommissionSummary,
  AdminPayout,
  PayoutStatistics,
  ProcessPayoutRequest,
  SalesMetrics,
  TopRealtor,
  ReportOverview,
  SystemSetting,
  CreateSettingRequest,
  BulkUpdateSettingsRequest,
  AdminSupportTicket,
  AdminTicketStatistics,
  ReplyToTicketRequest,
  ActivityLog,
  ActivityStatistics,
  DocumentTemplate,
  CreateDocumentTemplateRequest,
  AdminDocument,
  DocumentStatistics,
  GenerateDocumentRequest,
  AdminReferral,
  AdminReferralStatistics,
  AdminConversation,
  AdminMessagingStatistics,
  AdminUpload,
  AdminUploadStatistics,
  AdminPaginationParams,
  AdminDateRangeParams,
  AdminPayment,
  AdminPaymentStats,
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
  AdminConversationMessage,
  AnalyticsPeriod,
  AnalyticsDashboard,
  AnalyticsRevenueChart,
  AnalyticsUserGrowthChart,
  AnalyticsApplicationsChart,
  AnalyticsCommissionsChart,
  AnalyticsPropertyStats,
  AnalyticsKYCStats,
  AnalyticsPayoutStats,
  TopRealtorRanked,
  AnalyticsFull,
  ReportType,
  ReportEmailResponse,
  ReportParams,
  SuperAdminUser,
  SuperAdminUserDetail,
  SuperAdminStats,
  SuperAdminListParams,
  SuperAdminRealtorListParams,
  SuperAdminClientListParams,
  ChangeUserRoleRequest,
  ChangeUserRoleResponse,
} from '@/types/admin';
import type { ApiResponse, PaginatedResponse } from '@/types';

class AdminService {
  // ─── Dashboard ─────────────────────────────────────────────
  async getDashboard(): Promise<AdminDashboard> {
    const res = await api.get<AdminDashboard>('/dashboard/admin');
    return res.data!;
  }

  async getQuickStats(): Promise<AdminQuickStats> {
    const res = await api.get<AdminQuickStats>('/dashboard/quick-stats');
    return res.data!;
  }

  // ─── User Management ──────────────────────────────────────
  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    const res = await api.post<CreateUserResponse>('/admin/auth/create-user', data);
    return res.data!;
  }

  async unlockUser(userId: string): Promise<{ message: string }> {
    const res = await api.patch<{ message: string }>(`/admin/auth/unlock/${userId}`);
    return res.data!;
  }

  // ─── User Listing (Admin-level) ────────────────────────────
  // Helper: normalize paginated user response from backend
  // Backend may return { items, pagination } or { data, meta/total/page } or a raw array
  private normalizeUserList(raw: any): PaginatedResponse<SuperAdminUser> {
    if (!raw) return { items: [], pagination: { limit: 20, hasNext: false, hasPrev: false } };
    // Already has `items` array — standard shape
    if (Array.isArray(raw.items)) return raw;
    // Has `data` array (NestJS / backend convention)
    if (Array.isArray(raw.data)) {
      return {
        items: raw.data,
        pagination: raw.meta ?? raw.pagination ?? {
          limit: raw.limit ?? 20,
          total: raw.total,
          page: raw.page,
          totalPages: raw.lastPage ?? raw.totalPages,
          hasNext: raw.hasNext ?? (raw.data.length >= (raw.limit ?? 20)),
          hasPrev: raw.hasPrev ?? ((raw.page ?? 1) > 1),
        },
      };
    }
    // Raw is an array itself
    if (Array.isArray(raw)) {
      return { items: raw, pagination: { limit: 20, hasNext: false, hasPrev: false } };
    }
    // Fallback
    return { items: [], pagination: { limit: 20, hasNext: false, hasPrev: false } };
  }

  async getUsers(
    params?: SuperAdminListParams,
  ): Promise<PaginatedResponse<SuperAdminUser>> {
    const res = await api.get<any>(
      '/admin/users',
      params as Record<string, unknown>,
    );
    return this.normalizeUserList(res.data);
  }

  async getUserDetail(userId: string): Promise<SuperAdminUserDetail> {
    const res = await api.get<SuperAdminUserDetail>(`/admin/users/${userId}`);
    return res.data!;
  }

  async getAdminUsers(
    params?: { page?: number; limit?: number; search?: string },
  ): Promise<PaginatedResponse<SuperAdminUser>> {
    const res = await api.get<any>(
      '/admin/admins',
      params as Record<string, unknown>,
    );
    return this.normalizeUserList(res.data);
  }

  async getRealtorUsers(
    params?: SuperAdminRealtorListParams,
  ): Promise<PaginatedResponse<SuperAdminUser>> {
    const res = await api.get<any>(
      '/admin/realtors',
      params as Record<string, unknown>,
    );
    return this.normalizeUserList(res.data);
  }

  async getClientUsers(
    params?: SuperAdminClientListParams,
  ): Promise<PaginatedResponse<SuperAdminUser>> {
    const res = await api.get<any>(
      '/admin/clients',
      params as Record<string, unknown>,
    );
    return this.normalizeUserList(res.data);
  }

  async getSystemStats(): Promise<SuperAdminStats> {
    const res = await api.get<SuperAdminStats>('/admin/stats');
    return res.data!;
  }

  async changeUserRole(
    userId: string,
    data: ChangeUserRoleRequest,
  ): Promise<ChangeUserRoleResponse> {
    const res = await api.patch<ChangeUserRoleResponse>(
      `/admin/users/${userId}/role`,
      data,
    );
    return res.data!;
  }

  async deactivateUser(userId: string): Promise<{ message: string }> {
    const res = await api.patch<{ message: string }>(
      `/admin/users/${userId}/deactivate`,
    );
    return res.data!;
  }

  async reactivateUser(userId: string): Promise<{ message: string }> {
    const res = await api.patch<{ message: string }>(
      `/admin/users/${userId}/reactivate`,
    );
    return res.data!;
  }

  // ─── KYC Management ───────────────────────────────────────
  async getPendingKYC(status?: string): Promise<AdminKYCPendingResponse> {
    const params: Record<string, unknown> = {};
    if (status) params.status = status;
    const res = await api.get<AdminKYCPendingResponse>('/admin/kyc/pending', params);
    return res.data!;
  }

  async getClientKYC(clientId: string): Promise<AdminKYCClientDetail> {
    const res = await api.get<AdminKYCClientDetail>(`/admin/kyc/clients/${clientId}`);
    return res.data!;
  }

  async getRealtorKYC(realtorId: string): Promise<AdminKYCClientDetail> {
    const res = await api.get<AdminKYCClientDetail>(`/admin/kyc/realtors/${realtorId}`);
    return res.data!;
  }

  async verifyKYCDocument(
    documentId: string,
    data: VerifyKYCDocumentRequest,
  ): Promise<void> {
    const body: Record<string, unknown> = { approved: data.approved };
    if (!data.approved && data.rejectionReason) {
      body.rejectionReason = data.rejectionReason;
    }
    await api.post(`/admin/kyc/documents/${documentId}/verify`, body);
  }

  async getKYCStatistics(): Promise<AdminKYCStatistics> {
    const res = await api.get<AdminKYCStatistics>('/admin/kyc/statistics');
    return res.data!;
  }

  /** GET /admin/kyc/documents — raw listing of ALL KycDocument records (debug) */
  async getAllKYCDocuments(): Promise<{ total: number; documents: any[] }> {
    const res = await api.get<{ total: number; documents: any[] }>('/admin/kyc/documents');
    return res.data!;
  }

  // ─── Properties ────────────────────────────────────────────
  async createProperty(data: Record<string, unknown>): Promise<any> {
    const res = await api.post('/properties', data);
    return res.data;
  }

  async updateProperty(id: string, data: Record<string, unknown>): Promise<any> {
    const res = await api.patch(`/properties/${id}`, data);
    return res.data;
  }

  async deleteProperty(id: string): Promise<void> {
    await api.delete(`/properties/${id}`);
  }

  // ─── Applications ─────────────────────────────────────────
  async getApplications(
    params?: AdminPaginationParams & { status?: string },
  ): Promise<PaginatedResponse<AdminApplication>> {
    const res = await api.get<PaginatedResponse<AdminApplication>>(
      '/admin/applications',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async approveApplication(id: string): Promise<void> {
    await api.patch(`/admin/applications/${id}/approve`);
  }

  async rejectApplication(id: string): Promise<void> {
    await api.patch(`/admin/applications/${id}/reject`);
  }

  // ─── Sales ─────────────────────────────────────────────────
  async recordOfflineSale(data: RecordOfflineSaleRequest): Promise<any> {
    const res = await api.post('/admin/sales/offline', data);
    return res.data;
  }

  async getSales(
    params?: AdminDateRangeParams & { realtorId?: string; type?: string },
  ): Promise<AdminSale[]> {
    const res = await api.get<AdminSale[]>('/admin/sales', params as Record<string, unknown>);
    return res.data ?? [];
  }

  // ─── Payment Plans ────────────────────────────────────────
  async createPlanTemplate(data: CreatePaymentPlanTemplateRequest): Promise<PaymentPlanTemplate> {
    const res = await api.post<PaymentPlanTemplate>('/admin/payment-plans/templates', data);
    return res.data!;
  }

  async updatePlanTemplate(
    id: string,
    data: Partial<CreatePaymentPlanTemplateRequest>,
  ): Promise<PaymentPlanTemplate> {
    const res = await api.patch<PaymentPlanTemplate>(
      `/admin/payment-plans/templates/${id}`,
      data,
    );
    return res.data!;
  }

  async deletePlanTemplate(id: string): Promise<void> {
    await api.delete(`/admin/payment-plans/templates/${id}`);
  }

  async getEnrollments(
    params?: AdminPaginationParams & { status?: string },
  ): Promise<PaginatedResponse<PaymentPlanEnrollment>> {
    const res = await api.get<PaginatedResponse<PaymentPlanEnrollment>>(
      '/admin/payment-plans/enrollments',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async enrollApplication(data: EnrollApplicationRequest): Promise<any> {
    const res = await api.post('/admin/payment-plans/enrollments', data);
    return res.data;
  }

  async cancelEnrollment(id: string, reason: string): Promise<void> {
    await api.patch(`/admin/payment-plans/enrollments/${id}/cancel`, { reason });
  }

  async getOverdueInstallments(): Promise<OverdueInstallment[]> {
    const res = await api.get<OverdueInstallment[]>('/admin/payment-plans/overdue');
    return res.data ?? [];
  }

  async waiveInstallment(id: string, reason: string): Promise<void> {
    await api.patch(`/admin/payment-plans/installments/${id}/waive`, { reason });
  }

  async getPaymentPlanStatistics(): Promise<PaymentPlanStatistics> {
    const res = await api.get<PaymentPlanStatistics>('/admin/payment-plans/statistics');
    return res.data!;
  }

  // ─── Commissions ──────────────────────────────────────────
  async getCommissionRates(): Promise<CommissionRates> {
    const res = await api.get<CommissionRates>('/commissions/rates');
    return res.data!;
  }

  async updateCommissionRates(data: CommissionRates): Promise<CommissionRates> {
    const res = await api.patch<CommissionRates>('/commissions/rates', data);
    return res.data!;
  }

  async getCommissions(
    params?: AdminPaginationParams & {
      status?: string;
      type?: string;
      realtorId?: string;
    } & AdminDateRangeParams,
  ): Promise<PaginatedResponse<AdminCommission>> {
    const res = await api.get<PaginatedResponse<AdminCommission>>(
      '/commissions',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async getCommissionDetail(id: string): Promise<AdminCommission> {
    const res = await api.get<AdminCommission>(`/commissions/${id}`);
    return res.data!;
  }

  async bulkApproveCommissions(ids: string[]): Promise<void> {
    await api.post('/commissions/approve', { commissionIds: ids });
  }

  async bulkMarkPaid(ids: string[]): Promise<void> {
    await api.post('/commissions/mark-paid', { commissionIds: ids });
  }

  async bulkCancelCommissions(ids: string[]): Promise<void> {
    await api.post('/commissions/cancel', { commissionIds: ids });
  }

  async getMonthlyCommissionReport(
    year: number,
    month: number,
  ): Promise<MonthlyCommissionReport> {
    const res = await api.get<MonthlyCommissionReport>(`/commissions/report/${year}/${month}`);
    return res.data!;
  }

  async getRealtorCommissionSummary(realtorId: string): Promise<RealtorCommissionSummary> {
    const res = await api.get<RealtorCommissionSummary>(
      `/commissions/realtor-summary/${realtorId}`,
    );
    return res.data!;
  }

  // ─── Payouts ──────────────────────────────────────────────
  async getPayouts(
    params?: AdminPaginationParams & {
      status?: string;
      realtorId?: string;
    } & AdminDateRangeParams,
  ): Promise<PaginatedResponse<AdminPayout>> {
    const res = await api.get<PaginatedResponse<AdminPayout>>(
      '/admin/payouts',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async getPayoutStatistics(): Promise<PayoutStatistics> {
    const res = await api.get<PayoutStatistics>('/admin/payouts/statistics');
    return res.data!;
  }

  async getPayoutDetail(id: string): Promise<AdminPayout> {
    const res = await api.get<AdminPayout>(`/admin/payouts/${id}`);
    return res.data!;
  }

  async processPayout(id: string, data: ProcessPayoutRequest): Promise<void> {
    await api.post(`/admin/payouts/${id}/process`, data);
  }

  // ─── Analytics ────────────────────────────────────────────
  async getSalesMetrics(): Promise<SalesMetrics> {
    const res = await api.get<SalesMetrics>('/admin/analytics/sales-metrics');
    return res.data!;
  }

  async getSalesByDateRange(
    params?: AdminDateRangeParams,
  ): Promise<any[]> {
    const res = await api.get<any[]>(
      '/admin/analytics/sales',
      params as Record<string, unknown>,
    );
    return res.data ?? [];
  }

  async getTopRealtors(
    params?: { metric?: 'sales' | 'recruits'; limit?: number },
  ): Promise<TopRealtor[]> {
    const res = await api.get<TopRealtor[]>(
      '/admin/analytics/top-realtors',
      params as Record<string, unknown>,
    );
    return res.data ?? [];
  }

  // ─── Analytics (Enhanced — time-period filtering) ─────────
  async getAnalyticsDashboard(
    period: AnalyticsPeriod = '28d',
  ): Promise<AnalyticsDashboard> {
    const res = await api.get<AnalyticsDashboard>('/admin/analytics/dashboard', { period });
    return res.data!;
  }

  async getRevenueChart(
    period: AnalyticsPeriod = '28d',
  ): Promise<AnalyticsRevenueChart> {
    const res = await api.get<AnalyticsRevenueChart>('/admin/analytics/charts/revenue', { period });
    return res.data!;
  }

  async getUserGrowthChart(
    period: AnalyticsPeriod = '28d',
  ): Promise<AnalyticsUserGrowthChart> {
    const res = await api.get<AnalyticsUserGrowthChart>('/admin/analytics/charts/user-growth', { period });
    return res.data!;
  }

  async getApplicationsChart(
    period: AnalyticsPeriod = '28d',
  ): Promise<AnalyticsApplicationsChart> {
    const res = await api.get<AnalyticsApplicationsChart>('/admin/analytics/charts/applications', { period });
    return res.data!;
  }

  async getCommissionsChart(
    period: AnalyticsPeriod = '28d',
  ): Promise<AnalyticsCommissionsChart> {
    const res = await api.get<AnalyticsCommissionsChart>('/admin/analytics/charts/commissions', { period });
    return res.data!;
  }

  async getPropertyAnalytics(): Promise<AnalyticsPropertyStats> {
    const res = await api.get<AnalyticsPropertyStats>('/admin/analytics/properties');
    return res.data!;
  }

  async getKYCAnalytics(): Promise<AnalyticsKYCStats> {
    const res = await api.get<AnalyticsKYCStats>('/admin/analytics/kyc');
    return res.data!;
  }

  async getPayoutAnalytics(
    period: AnalyticsPeriod = '28d',
  ): Promise<AnalyticsPayoutStats> {
    const res = await api.get<AnalyticsPayoutStats>('/admin/analytics/payouts', { period });
    return res.data!;
  }

  async getTopRealtorsRanked(
    period: AnalyticsPeriod = '28d',
  ): Promise<TopRealtorRanked[]> {
    const res = await api.get<TopRealtorRanked[]>(`/admin/analytics/top-realtors/${period}`);
    return res.data ?? [];
  }

  async getFullAnalytics(
    period: AnalyticsPeriod = '28d',
  ): Promise<AnalyticsFull> {
    const res = await api.get<AnalyticsFull>('/admin/analytics/full', { period });
    return res.data!;
  }

  // ─── Reports & Exports ────────────────────────────────────
  async getOverviewReport(params?: AdminDateRangeParams): Promise<ReportOverview> {
    const res = await api.get<ReportOverview>(
      '/admin/reports/overview',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async getSalesReport(
    params?: AdminDateRangeParams & { realtorId?: string; type?: string },
  ): Promise<any> {
    const res = await api.get('/admin/reports/sales', params as Record<string, unknown>);
    return res.data;
  }

  async getApplicationsReport(
    params?: AdminDateRangeParams & { propertyId?: string; status?: string },
  ): Promise<any> {
    const res = await api.get('/admin/reports/applications', params as Record<string, unknown>);
    return res.data;
  }

  async getCommissionsReport(params?: AdminDateRangeParams): Promise<any> {
    const res = await api.get('/admin/reports/commissions', params as Record<string, unknown>);
    return res.data;
  }

  async getPaymentPlansReport(params?: AdminDateRangeParams): Promise<any> {
    const res = await api.get('/admin/reports/payment-plans', params as Record<string, unknown>);
    return res.data;
  }

  async getPropertiesReport(params?: AdminDateRangeParams): Promise<any> {
    const res = await api.get('/admin/reports/properties', params as Record<string, unknown>);
    return res.data;
  }

  async getRealtorsReport(params?: AdminDateRangeParams): Promise<any> {
    const res = await api.get('/admin/reports/realtors', params as Record<string, unknown>);
    return res.data;
  }

  // ─── Reports — CSV Export Downloads ───────────────────────
  async exportReportCSV(
    type: ReportType,
    params?: ReportParams,
  ): Promise<string> {
    const res = await api.get<string>(
      `/admin/reports/export/${type}`,
      params as Record<string, unknown>,
    );
    return res.data ?? '';
  }

  // ─── Reports — Email Delivery ─────────────────────────────
  async emailReport(
    type: ReportType,
    params?: ReportParams,
  ): Promise<ReportEmailResponse> {
    const queryString = params
      ? '?' + Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    const res = await api.post<ReportEmailResponse>(
      `/admin/reports/email/${type}${queryString}`,
    );
    return res.data!;
  }

  // ─── Settings ─────────────────────────────────────────────
  async initializeSettings(): Promise<void> {
    await api.post('/admin/settings/initialize');
  }

  async getSettings(): Promise<Record<string, SystemSetting[]>> {
    const res = await api.get<Record<string, SystemSetting[]>>('/admin/settings');
    return res.data!;
  }

  async getSettingCategories(): Promise<string[]> {
    const res = await api.get<string[]>('/admin/settings/categories');
    return res.data ?? [];
  }

  async getSettingsByCategory(category: string): Promise<SystemSetting[]> {
    const res = await api.get<SystemSetting[]>(`/admin/settings/category/${category}`);
    return res.data ?? [];
  }

  async getSetting(key: string): Promise<SystemSetting> {
    const res = await api.get<SystemSetting>(`/admin/settings/${key}`);
    return res.data!;
  }

  async createSetting(data: CreateSettingRequest): Promise<SystemSetting> {
    const res = await api.post<SystemSetting>('/admin/settings', data);
    return res.data!;
  }

  async updateSetting(key: string, data: { value: string; description?: string }): Promise<SystemSetting> {
    const res = await api.patch<SystemSetting>(`/admin/settings/${key}`, data);
    return res.data!;
  }

  async bulkUpdateSettings(data: BulkUpdateSettingsRequest): Promise<void> {
    await api.patch('/admin/settings/bulk', data);
  }

  async deleteSetting(key: string): Promise<void> {
    await api.delete(`/admin/settings/${key}`);
  }

  async enableMaintenance(message: string): Promise<void> {
    await api.patch('/admin/settings/maintenance/enable', { message });
  }

  async disableMaintenance(): Promise<void> {
    await api.patch('/admin/settings/maintenance/disable');
  }

  async toggleFeatureFlag(feature: string, enabled: boolean): Promise<void> {
    await api.patch(`/admin/settings/feature/${feature}/toggle`, { enabled });
  }

  async updateCommissionRatesSettings(data: CommissionRates): Promise<void> {
    await api.patch('/admin/settings/commission/rates', data);
  }

  // ─── Support Tickets ──────────────────────────────────────
  async getTickets(
    params?: AdminPaginationParams & { status?: string; priority?: string },
  ): Promise<PaginatedResponse<AdminSupportTicket>> {
    const res = await api.get<PaginatedResponse<AdminSupportTicket>>(
      '/admin/support-tickets',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async getTicketStatistics(): Promise<AdminTicketStatistics> {
    const res = await api.get<AdminTicketStatistics>('/admin/support-tickets/statistics');
    return res.data!;
  }

  async getTicketDetail(id: string): Promise<AdminSupportTicket> {
    const res = await api.get<AdminSupportTicket>(`/admin/support-tickets/${id}`);
    return res.data!;
  }

  async replyToTicket(id: string, data: ReplyToTicketRequest): Promise<void> {
    await api.post(`/admin/support-tickets/${id}/messages`, data);
  }

  async assignTicket(id: string, adminId: string): Promise<void> {
    await api.put(`/admin/support-tickets/${id}/assign`, { adminId });
  }

  async updateTicketStatus(
    id: string,
    data: { status: string; note?: string },
  ): Promise<void> {
    await api.put(`/admin/support-tickets/${id}/status`, data);
  }

  // ─── Activity Logs ────────────────────────────────────────
  async getActivityLogs(
    params?: {
      action?: string;
      entityType?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    } & AdminDateRangeParams,
  ): Promise<ActivityLog[]> {
    const res = await api.get<ActivityLog[]>(
      '/admin/activity-logs',
      params as Record<string, unknown>,
    );
    return res.data ?? [];
  }

  async getRecentActivity(limit?: number): Promise<ActivityLog[]> {
    const params: Record<string, unknown> = {};
    if (limit) params.limit = limit;
    const res = await api.get<ActivityLog[]>('/admin/activity-logs/recent', params);
    return res.data ?? [];
  }

  async getUserActivity(userId: string): Promise<ActivityLog[]> {
    const res = await api.get<ActivityLog[]>(`/admin/activity-logs/user/${userId}`);
    return res.data ?? [];
  }

  async getEntityActivity(entityType: string, entityId: string): Promise<ActivityLog[]> {
    const res = await api.get<ActivityLog[]>(
      `/admin/activity-logs/entity/${entityType}/${entityId}`,
    );
    return res.data ?? [];
  }

  async getActivityStatistics(days?: number): Promise<ActivityStatistics> {
    const params: Record<string, unknown> = {};
    if (days) params.days = days;
    const res = await api.get<ActivityStatistics>('/admin/activity-logs/statistics', params);
    return res.data!;
  }

  async cleanupLogs(olderThanDays?: number): Promise<void> {
    const params: Record<string, unknown> = {};
    if (olderThanDays) params.olderThanDays = olderThanDays;
    await api.delete('/admin/activity-logs/cleanup');
  }

  // ─── Documents & Templates ────────────────────────────────
  async getDocumentTemplates(activeOnly?: boolean): Promise<DocumentTemplate[]> {
    const params: Record<string, unknown> = {};
    if (activeOnly !== undefined) params.activeOnly = activeOnly;
    const res = await api.get<DocumentTemplate[]>('/admin/documents/templates', params);
    return res.data ?? [];
  }

  async getDocumentTemplate(id: string): Promise<DocumentTemplate> {
    const res = await api.get<DocumentTemplate>(`/admin/documents/templates/${id}`);
    return res.data!;
  }

  async createDocumentTemplate(data: CreateDocumentTemplateRequest): Promise<DocumentTemplate> {
    const res = await api.post<DocumentTemplate>('/admin/documents/templates', data);
    return res.data!;
  }

  async updateDocumentTemplate(
    id: string,
    data: Partial<CreateDocumentTemplateRequest>,
  ): Promise<DocumentTemplate> {
    const res = await api.patch<DocumentTemplate>(`/admin/documents/templates/${id}`, data);
    return res.data!;
  }

  async deleteDocumentTemplate(id: string): Promise<void> {
    await api.delete(`/admin/documents/templates/${id}`);
  }

  async getDocuments(
    params?: AdminPaginationParams & { type?: string; status?: string },
  ): Promise<AdminDocument[]> {
    const res = await api.get<AdminDocument[]>(
      '/admin/documents',
      params as Record<string, unknown>,
    );
    return res.data ?? [];
  }

  async generateDocument(data: GenerateDocumentRequest): Promise<any> {
    const res = await api.post('/admin/documents/generate', data);
    return res.data;
  }

  async getDocumentStatistics(): Promise<DocumentStatistics> {
    const res = await api.get<DocumentStatistics>('/admin/documents/statistics');
    return res.data!;
  }

  // ─── Referrals ────────────────────────────────────────────
  async getReferrals(
    params?: AdminPaginationParams & { realtorId?: string },
  ): Promise<PaginatedResponse<AdminReferral>> {
    const res = await api.get<PaginatedResponse<AdminReferral>>(
      '/admin/referrals',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async getReferralStatistics(): Promise<AdminReferralStatistics> {
    const res = await api.get<AdminReferralStatistics>('/admin/referrals/statistics');
    return res.data!;
  }

  // ─── Messaging ────────────────────────────────────────────
  async getConversations(
    params?: { propertyId?: string; userId?: string },
  ): Promise<AdminConversation[]> {
    const res = await api.get<AdminConversation[]>(
      '/admin/messaging/conversations',
      params as Record<string, unknown>,
    );
    return res.data ?? [];
  }

  async getMessagingStatistics(): Promise<AdminMessagingStatistics> {
    const res = await api.get<AdminMessagingStatistics>('/admin/messaging/statistics');
    return res.data!;
  }

  // ─── Uploads ──────────────────────────────────────────────
  async getUploads(
    params?: AdminPaginationParams & { category?: string; userId?: string },
  ): Promise<PaginatedResponse<AdminUpload>> {
    const res = await api.get<PaginatedResponse<AdminUpload>>(
      '/admin/uploads',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async getUploadStatistics(): Promise<AdminUploadStatistics> {
    const res = await api.get<AdminUploadStatistics>('/admin/uploads/statistics');
    return res.data!;
  }

  // ─── Password Reset (Admin) ──────────────────────────────
  async resetUserPassword(userId: string): Promise<{ message: string; temporaryPassword?: string }> {
    const res = await api.post<{ message: string; temporaryPassword?: string }>(
      `/admin/auth/reset-password/${userId}`,
    );
    return res.data!;
  }

  // ─── Payments (Admin) ─────────────────────────────────────
  async getPayments(
    params?: AdminPaginationParams & {
      status?: string;
      type?: string;
      clientId?: string;
    } & AdminDateRangeParams,
  ): Promise<PaginatedResponse<AdminPayment>> {
    const res = await api.get<PaginatedResponse<AdminPayment>>(
      '/admin/payments',
      params as Record<string, unknown>,
    );
    return res.data!;
  }

  async getPaymentStats(): Promise<AdminPaymentStats> {
    const res = await api.get<AdminPaymentStats>('/admin/payments/stats');
    return res.data!;
  }

  // ─── Broadcast Notifications ──────────────────────────────
  async broadcastNotification(
    data: BroadcastNotificationRequest,
  ): Promise<BroadcastNotificationResponse> {
    const res = await api.post<BroadcastNotificationResponse>(
      '/admin/notifications/broadcast',
      data,
    );
    return res.data!;
  }

  // ─── Conversation Messages (Admin Bypass) ─────────────────
  async getConversationMessages(
    conversationId: string,
    params?: AdminPaginationParams,
  ): Promise<AdminConversationMessage[]> {
    const res = await api.get<AdminConversationMessage[]>(
      `/admin/messaging/conversations/${conversationId}`,
      params as Record<string, unknown>,
    );
    return res.data ?? [];
  }
}

export const adminService = new AdminService();
export default adminService;
