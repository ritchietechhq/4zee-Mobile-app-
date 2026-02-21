// ============================================================
// Admin Panel Types
// Matches: docs/ADMIN_PANEL_IMPLEMENTATION.md (89 endpoints)
// ============================================================

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export interface AdminDashboardOverview {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalProperties: number;
  propertiesByAvailability: Record<string, number>;
}

export interface AdminDashboardApplications {
  total: number;
  byStatus: Record<string, number>;
}

export interface AdminDashboardFinancials {
  totalSalesValue: number; // kobo
  completedSales: number;
  totalPaymentsReceived: number; // kobo
  totalPayments: number;
}

export interface AdminPendingActions {
  kycPending: number;
  payoutsPending: { count: number; amount: number }; // amount in kobo
  openSupportTickets: number;
}

export interface AdminRecentActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface AdminDashboard {
  overview: AdminDashboardOverview;
  applications: AdminDashboardApplications;
  financials: AdminDashboardFinancials;
  pendingActions: AdminPendingActions;
  recentActivity: AdminRecentActivity[];
}

export interface AdminQuickStats {
  unreadNotifications: number;
  unreadMessages: number;
  pendingKyc: number;
  pendingPayouts: number;
  openTickets: number;
}

// ---------------------------------------------------------------------------
// User Management
// ---------------------------------------------------------------------------
export interface CreateUserRequest {
  email: string;
  role: 'ADMIN' | 'REALTOR' | 'CLIENT';
  firstName?: string;
  lastName?: string;
}

export interface CreateUserResponse {
  id: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// KYC Management
// ---------------------------------------------------------------------------
export interface AdminKYCDocument {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  canApprove: boolean;
  canReject: boolean;
  verifyEndpoint: string;
  // Legacy fields — may or may not exist
  idNumber?: string;
  fileName?: string;
  createdAt?: string;
}

export interface AdminKYCRequest {
  entityId: string;
  entityType: 'client' | 'realtor';
  email: string;
  firstName: string;
  lastName: string;
  kycStatus: string;
  documents: AdminKYCDocument[];
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
}

export interface AdminKYCSummary {
  totalDocuments: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdminKYCPendingResponse {
  requests: AdminKYCRequest[];
  total: number;
  summary: AdminKYCSummary;
  actions: {
    approve: { method: string; endpoint: string; body: Record<string, unknown> };
    reject: { method: string; endpoint: string; body: Record<string, unknown> };
  };
}

/** @deprecated Use AdminKYCRequest instead */
export interface AdminKYCClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  kycStatus: string;
  user: { email: string };
  kycDocuments: AdminKYCDocument[];
}

export interface AdminKYCClientDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  kycStatus: string;
  user: { email: string; createdAt: string };
  kycDocuments: AdminKYCDocument[];
  applications: Array<{
    id: string;
    status: string;
    property: { title: string };
    createdAt: string;
  }>;
}

export interface VerifyKYCDocumentRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface AdminKYCStatistics {
  byStatus: Record<string, number>;
  clients: Record<string, number>;
  realtors: Record<string, number>;
  submissionsLast24h: number;
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------
export interface AdminApplication {
  id: string;
  status: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    user: { email: string };
  };
  property: {
    id: string;
    title: string;
    price: number;
  };
  realtor: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------
export interface AdminSale {
  id: string;
  amount: number; // kobo
  type: 'ONLINE' | 'OFFLINE';
  createdAt: string;
  property: { id: string; title: string };
  client: { id: string; firstName: string; lastName: string };
  realtor: { id: string; firstName: string; lastName: string };
}

export interface RecordOfflineSaleRequest {
  propertyId: string;
  clientId: string;
  amount: number; // kobo
  realtorId: string;
}

// ---------------------------------------------------------------------------
// Payment Plans
// ---------------------------------------------------------------------------
export interface PaymentPlanTemplate {
  id: string;
  name: string;
  durationMonths: number;
  interestRate: number;
  description?: string;
  isActive: boolean;
  minimumDownPayment?: number; // kobo
  maxEnrollments?: number;
  terms?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentPlanTemplateRequest {
  name: string;
  durationMonths: number;
  interestRate: number;
  description?: string;
  isActive?: boolean;
  minimumDownPayment?: number;
  maxEnrollments?: number;
  terms?: string;
}

export interface PaymentPlanEnrollment {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DEFAULTED';
  applicationId: string;
  templateId: string;
  startDate: string;
  createdAt: string;
  client?: { id: string; firstName: string; lastName: string };
  property?: { id: string; title: string };
}

export interface EnrollApplicationRequest {
  applicationId: string;
  templateId: string;
  startDate: string;
}

export interface OverdueInstallment {
  id: string;
  amount: number; // kobo
  dueDate: string;
  enrollment: {
    id: string;
    client: { id: string; firstName: string; lastName: string };
    property: { id: string; title: string };
  };
}

export interface PaymentPlanStatistics {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  cancelledEnrollments: number;
  totalPaidAmount: number; // kobo
  totalPendingAmount: number; // kobo
  totalOverdueAmount: number; // kobo
  overdueInstallments: number;
}

// ---------------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------------
export interface CommissionRates {
  directRate: number;
  referralRate: number;
}

export interface AdminCommission {
  id: string;
  type: 'DIRECT' | 'REFERRAL';
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  amount: number; // kobo
  saleAmount: number; // kobo
  rate: number;
  createdAt: string;
  realtor: { id: string; firstName: string; lastName: string };
  sale?: { id: string; property?: { title: string } };
}

export interface MonthlyCommissionReport {
  month: number;
  year: number;
  totalCommissions: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export interface RealtorCommissionSummary {
  realtorId: string;
  totalCommissions: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  byType: Record<string, { count: number; amount: number }>;
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------
export type PayoutStatusAdmin =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED';

export interface AdminPayout {
  id: string;
  amount: number; // kobo
  status: PayoutStatusAdmin;
  createdAt: string;
  processedAt?: string;
  realtor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface PayoutStatistics {
  totalPayouts: number;
  totalAmount: number; // kobo
  byStatus: Record<string, number>;
  pendingAmount: number; // kobo
}

export interface ProcessPayoutRequest {
  approved: boolean;
  rejectionReason?: string | null;
}

// ---------------------------------------------------------------------------
// Analytics (Legacy)
// ---------------------------------------------------------------------------
export interface SalesMetrics {
  count: number;
  totalAmount: number; // kobo
  averageAmount: number; // kobo
}

export interface TopRealtor {
  id: string;
  firstName: string;
  lastName: string;
  salesCount: number;
  totalSalesValue: number; // kobo
}

// ---------------------------------------------------------------------------
// Analytics — Enhanced (time-period filtering)
// ---------------------------------------------------------------------------
export type AnalyticsPeriod = '24h' | '7d' | '28d' | '3m' | '9m' | '1y' | 'all';

export interface AnalyticsDashboard {
  period: string;
  revenue: {
    total: number; // kobo
    salesCount: number;
    salesToday: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    conversionRate: number;
  };
  payments: {
    success: number;
    failed: number;
    pending: number;
  };
  commissions: {
    pending: { count: number; amount: number };
    approved: { count: number; amount: number };
    paid: { count: number; amount: number };
  };
  users: {
    total: number;
    new: number;
    clients: number;
    realtors: number;
  };
  properties: {
    total: number;
    available: number;
    sold: number;
  };
  payouts: {
    pending: { count: number; amount: number };
    processed: { count: number; amount: number };
  };
  kyc: {
    pendingClients: number;
    pendingRealtors: number;
    totalPending: number;
  };
  supportTickets: {
    open: number;
  };
  paymentPlans: {
    activeEnrollments: number;
    overdueInstallments: number;
  };
}

export interface AnalyticsChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface AnalyticsRevenueChart {
  period: string;
  interval: string;
  data: Array<{
    date: string;
    salesCount: number;
    revenue: number; // kobo
  }>;
}

export interface AnalyticsUserGrowthChart {
  period: string;
  interval: string;
  data: Array<{
    date: string;
    clients: number;
    realtors: number;
    total: number;
  }>;
}

export interface AnalyticsApplicationsChart {
  period: string;
  interval: string;
  data: Array<{
    date: string;
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

export interface AnalyticsCommissionsChart {
  period: string;
  interval: string;
  data: Array<{
    date: string;
    direct: number;
    referral: number;
    total: number;
  }>;
}

export interface AnalyticsPropertyStats {
  byType: Record<string, number>;
  byAvailability: Record<string, number>;
  byLocation: Array<{ location: string; count: number }>;
  topViewed: Array<{ id: string; title: string; views: number }>;
  topFavourited: Array<{ id: string; title: string; favourites: number }>;
}

export interface AnalyticsKYCStats {
  clients: Record<string, number>;
  realtors: Record<string, number>;
}

export interface AnalyticsPayoutStats {
  byStatus: Record<string, number>;
  pending: { count: number; amount: number };
  processed: { count: number; amount: number };
}

export interface TopRealtorRanked {
  id: string;
  firstName: string;
  lastName: string;
  salesCount: number;
  totalSalesValue: number; // kobo
  totalCommission: number; // kobo
  rank: number;
}

export interface AnalyticsFull {
  overview: AnalyticsDashboard;
  charts: {
    revenue: AnalyticsRevenueChart;
    userGrowth: AnalyticsUserGrowthChart;
    applications: AnalyticsApplicationsChart;
    commissions: AnalyticsCommissionsChart;
  };
  topRealtors: TopRealtorRanked[];
  properties: AnalyticsPropertyStats;
  kyc: AnalyticsKYCStats;
  payouts: AnalyticsPayoutStats;
}

// ---------------------------------------------------------------------------
// Reports (Legacy)
// ---------------------------------------------------------------------------
export interface ReportOverview {
  revenue: Record<string, unknown>;
  salesCount: number;
  applicationStats: Record<string, unknown>;
  propertyInventory: Record<string, unknown>;
  userCounts: Record<string, unknown>;
  alerts: unknown[];
}

// ---------------------------------------------------------------------------
// Reports — Enhanced (CSV export + email delivery)
// ---------------------------------------------------------------------------
export type ReportType =
  | 'sales'
  | 'commissions'
  | 'applications'
  | 'realtors'
  | 'clients'
  | 'payments'
  | 'properties'
  | 'payment-plans'
  | 'payouts';

export interface ReportEmailResponse {
  message: string;
  rows: number;
  dateRange: string;
}

export interface ReportParams {
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export type SettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

export interface SystemSetting {
  key: string;
  value: string;
  type: SettingType;
  category: string;
  description?: string;
}

export interface CreateSettingRequest {
  key: string;
  value: string;
  type: SettingType;
  category: string;
  description?: string;
}

export interface BulkUpdateSettingsRequest {
  settings: Array<{ key: string; value: string }>;
}

// ---------------------------------------------------------------------------
// Support Tickets
// ---------------------------------------------------------------------------
export type AdminTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type AdminTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AdminTicketMessage {
  id: string;
  content: string;
  attachmentUrl?: string;
  isInternal: boolean;
  sender: { id: string; email: string; role: string };
  createdAt: string;
}

export interface AdminSupportTicket {
  id: string;
  subject: string;
  status: AdminTicketStatus;
  priority: AdminTicketPriority;
  category?: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; email: string; firstName?: string; lastName?: string };
  assignee?: { id: string; email: string };
  messages?: AdminTicketMessage[];
}

export interface AdminTicketStatistics {
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  averageResponseTime: string;
  averageResolutionTime: string;
}

export interface ReplyToTicketRequest {
  content: string;
  attachmentUrl?: string;
  isInternal?: boolean;
}

// ---------------------------------------------------------------------------
// Activity Logs
// ---------------------------------------------------------------------------
export type ActivityAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT'
  | 'APPROVE' | 'REJECT' | 'PAYMENT' | 'DOWNLOAD' | 'SIGN' | 'EXPORT';

export interface ActivityLog {
  id: string;
  action: ActivityAction | string;
  entityType: string;
  entityId: string;
  description: string;
  userId?: string;
  user?: { email: string; role: string };
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityStatistics {
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  byDay: Array<{ date: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
}

// ---------------------------------------------------------------------------
// Documents & Templates
// ---------------------------------------------------------------------------
export type DocumentTemplateType = 'ALLOCATION_LETTER' | 'RECEIPT' | 'AGREEMENT';

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentTemplateType | string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentTemplateRequest {
  name: string;
  type: string;
  content: string;
  isActive?: boolean;
}

export interface AdminDocument {
  id: string;
  type: string;
  status: string;
  fileUrl?: string;
  createdAt: string;
  application?: { id: string };
  client?: { id: string; firstName: string; lastName: string };
}

export interface DocumentStatistics {
  totalDocuments: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface GenerateDocumentRequest {
  applicationId: string;
  type: string;
  templateId: string;
}

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------
export interface AdminReferral {
  id: string;
  referrer: { id: string; firstName: string; lastName: string };
  referred: { id: string; firstName: string; lastName: string };
  status: string;
  createdAt: string;
}

export interface AdminReferralStatistics {
  totalLinks: number;
  totalVisits: number;
  totalConversions: number;
  conversionRate: number;
  topPerformers: Array<{
    realtorId: string;
    name: string;
    conversions: number;
  }>;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
export interface AdminConversation {
  id: string;
  participants: Array<{ id: string; email: string; role: string }>;
  lastMessage?: { content: string; createdAt: string };
  property?: { id: string; title: string };
  createdAt: string;
}

export interface AdminMessagingStatistics {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: string;
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------
export interface AdminUpload {
  id: string;
  fileName: string;
  fileUrl: string;
  category: string;
  size: number;
  userId: string;
  createdAt: string;
}

export interface AdminUploadStatistics {
  totalFiles: number;
  totalSizeBytes: number;
  byCategory: Record<
    string,
    { count: number; size: number }
  >;
}

// ---------------------------------------------------------------------------
// Payments (Admin)
// ---------------------------------------------------------------------------
export interface AdminPayment {
  id: string;
  amount: number; // kobo
  status: string;
  type: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; firstName: string; lastName: string };
  property?: { id: string; title: string };
  application?: { id: string };
}

export interface AdminPaymentStats {
  totalPayments: number;
  totalAmount: number; // kobo
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentCount: number;
}

// ---------------------------------------------------------------------------
// Broadcast Notifications (Admin)
// ---------------------------------------------------------------------------
export interface BroadcastNotificationRequest {
  title: string;
  body: string;
  targetRole?: 'CLIENT' | 'REALTOR' | 'ADMIN' | 'ALL';
  data?: Record<string, unknown>;
}

export interface BroadcastNotificationResponse {
  message: string;
  recipientCount: number;
}

// ---------------------------------------------------------------------------
// Conversation Messages (Admin Bypass)
// ---------------------------------------------------------------------------
export interface AdminConversationMessage {
  id: string;
  content: string;
  senderId: string;
  sender?: { id: string; email: string; role: string; firstName?: string; lastName?: string };
  conversationId: string;
  createdAt: string;
  readAt?: string;
}

// ---------------------------------------------------------------------------
// Super Admin Types — SUPER_ADMIN only
// ---------------------------------------------------------------------------
export type SuperAdminUserRole = 'ADMIN' | 'SUPER_ADMIN' | 'REALTOR' | 'CLIENT';

export interface SuperAdminUser {
  id: string;
  email: string;
  role: SuperAdminUserRole;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    kycStatus?: string;
  };
}

export interface SuperAdminUserDetail {
  id: string;
  email: string;
  role: SuperAdminUserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  twoFactorEnabled: boolean;
  profile?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    kycStatus?: string;
    profilePictureUrl?: string;
  };
  kycDocuments?: Array<{
    id: string;
    type: string;
    status: string;
    fileUrl: string;
    createdAt: string;
  }>;
  sessions?: Array<{
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    expiresAt: string;
  }>;
}

export interface ChangeUserRoleRequest {
  role: 'ADMIN' | 'CLIENT' | 'REALTOR';
}

export interface ChangeUserRoleResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface SuperAdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  byRole: Record<string, number>;
  recentRegistrations: number;
  registrationsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

export interface SuperAdminListParams {
  page?: number;
  limit?: number;
  role?: SuperAdminUserRole;
  isActive?: boolean;
  search?: string;
}

export interface SuperAdminRealtorListParams {
  page?: number;
  limit?: number;
  search?: string;
  kycStatus?: string;
}

export interface SuperAdminClientListParams {
  page?: number;
  limit?: number;
  search?: string;
  kycStatus?: string;
}

// ---------------------------------------------------------------------------
// Shared Query Params
// ---------------------------------------------------------------------------
export interface AdminPaginationParams {
  limit?: number;
  cursor?: string;
  page?: number;
}

export interface AdminDateRangeParams {
  startDate?: string;
  endDate?: string;
}
