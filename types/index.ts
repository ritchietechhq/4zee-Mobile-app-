// ============================================================
// 4Zee Properties — Barrel Export
// ============================================================

// API envelope
export type {
  ApiErrorCode,
  ApiError,
  PaginationMeta,
  ApiMeta,
  ApiResponse,
  PaginatedResponse,
} from './api';

// Auth
export type {
  UserRole,
  User,
  AuthTokens,
  Auth2FARequired,
  LoginResponse,
  RegisterRequest,
  LoginRequest,
  Verify2FARequest,
  RefreshTokenRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  OTPType,
  RequestOTPPayload,
  VerifyOTPPayload,
  RevokeSessionRequest,
  Session,
  TwoFASetupResponse,
} from './auth';
export { is2FARequired } from './auth';

// Properties
export type {
  PropertyType,
  PropertyAvailability,
  Property,
  PropertySearchFilters,
  CreateListingRequest,
  UpdateListingRequest,
  ListingStats,
} from './property';

// Applications
export type {
  ApplicationStatus,
  ApplicationPaymentStatus,
  ApplicationProperty,
  ApplicationUser,
  ApplicationClient,
  ApplicationRealtor,
  Application,
  CreateApplicationRequest,
} from './application';

// Payments
export type {
  PaymentStatusValue,
  Payment,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentStatusResponse,
  PaymentDetail,
} from './payment';

// Documents
export type { DocumentType, Document } from './document';

// Notifications
export type {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
  NotificationPreferences,
  RegisterDeviceRequest,
  DeviceInfo,
} from './notification';

// User Profile
export type { UpdateProfileRequest, ProfilePictureResponse } from './user';

// KYC
export type { KYCStatus, KYCDocumentType, KYCDocument, KYC, SubmitKYCDocumentRequest, UpdateKYCPersonalInfoRequest, KYCStatusSummary } from './kyc';

// Bank Accounts
export type {
  BankAccount,
  Bank,
  AddBankAccountRequest,
  VerifyAccountRequest,
  VerifyAccountResponse,
  VerifyAndSaveRequest,
  VerifyAndSaveResponse,
} from './bank-account';

// Commissions
export type {
  CommissionType,
  CommissionStatus,
  CommissionSale,
  Commission,
  CommissionSummary,
} from './commission';

// Payouts
export type {
  PayoutStatus,
  Payout,
  RequestPayoutRequest,
  PayoutBalance,
} from './payout';

// Referrals
export type { ReferralInfo, Referral } from './referral';

// Support Tickets
export type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketMessage,
  SupportTicket,
  CreateTicketRequest,
  ReplyTicketRequest,
} from './support';

// Messaging
export type {
  ConversationParticipant,
  ConversationLastMessage,
  Conversation,
  Message,
  SendMessageRequest,
  StartConversationRequest,
} from './messaging';

// Dashboard
export type { ClientDashboard, RealtorDashboard, RealtorDashboardProfile, RealtorDashboardApplication } from './dashboard';

// Admin Panel
export type {
  AdminDashboard,
  AdminDashboardOverview,
  AdminDashboardApplications,
  AdminDashboardFinancials,
  AdminPendingActions,
  AdminRecentActivity,
  AdminQuickStats,
  CreateUserRequest,
  CreateUserResponse,
  AdminKYCPendingResponse,
  AdminKYCClientDetail,
  AdminKYCDocument,
  AdminKYCClient,
  AdminKYCRequest,
  AdminKYCSummary,
  AdminKYCStatistics,
  VerifyKYCDocumentRequest,
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
  PayoutStatusAdmin,
  PayoutStatistics,
  ProcessPayoutRequest,
  SalesMetrics,
  TopRealtor,
  ReportOverview,
  AnalyticsPeriod,
  AnalyticsDashboard,
  AnalyticsChartDataPoint,
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
  SettingType,
  SystemSetting,
  CreateSettingRequest,
  BulkUpdateSettingsRequest,
  AdminTicketStatus,
  AdminTicketPriority,
  AdminTicketMessage,
  AdminSupportTicket,
  AdminTicketStatistics,
  ReplyToTicketRequest,
  ActivityAction,
  ActivityLog,
  ActivityStatistics,
  DocumentTemplateType,
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
  // New: Payments, Broadcast, Conversation Messages
  AdminPayment,
  AdminPaymentStats,
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
  AdminConversationMessage,
  // New: Super Admin types
  SuperAdminUserRole,
  SuperAdminUser,
  SuperAdminUserDetail,
  ChangeUserRoleRequest,
  ChangeUserRoleResponse,
  SuperAdminStats,
  SuperAdminListParams,
  SuperAdminRealtorListParams,
  SuperAdminClientListParams,
} from './admin';

// Realtor
export type {
  ActivityFeedType,
  ActivityFeedItem,
  ActivityFeedResponse,
  ListingAnalyticsItem,
  ListingAnalyticsSummary,
  ListingAnalyticsResponse,
  GoalProgress,
  GoalsResponse,
  ScheduleItemType,
  SchedulePriority,
  ScheduleItem,
  ScheduleResponse,
  UnreadMessagesResponse,
} from './realtor';
