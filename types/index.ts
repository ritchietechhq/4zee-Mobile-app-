// ============================================================
// 4Zee Properties — Barrel Export
























































export default realtorService;export const realtorService = new RealtorService();}  }    return res.data!.publicUrl || res.data!.url;    );      formData,      '/uploads/direct',    const res = await api.upload<{ url: string; publicUrl?: string }>(  async uploadImage(formData: FormData): Promise<string> {  /** POST /uploads/direct — upload a property image */  }    await api.delete(`/realtor/listings/${id}`);  async deleteListing(id: string): Promise<void> {  /** DELETE /realtor/listings/:id — delete listing */  }    return res.data!;    const res = await api.patch<Property>(`/realtor/listings/${id}`, payload);  async updateListing(id: string, payload: UpdateListingRequest): Promise<Property> {  /** PATCH /realtor/listings/:id — update listing */  }    return res.data!;    const res = await api.post<Property>('/realtor/listings', payload);  async createListing(payload: CreateListingRequest): Promise<Property> {  /** POST /realtor/listings — create new listing */  }    return res.data!;    const res = await api.get<ListingStats>('/realtor/listings/stats');  async getListingStats(): Promise<ListingStats> {  /** GET /realtor/listings/stats — listing counts + views */  }    return res.data!;    const res = await api.get<PaginatedResponse<Property>>('/realtor/listings', params);  async getMyListings(params?: Record<string, unknown>): Promise<PaginatedResponse<Property>> {  /** GET /realtor/listings — get realtor's own listings */class RealtorService {} from '@/types';  PaginatedResponse,  ListingStats,  UpdateListingRequest,  CreateListingRequest,  Property,import type {import api from './api';// ============================================================//            PATCH/DELETE /realtor/listings/:id, POST /uploads/direct// Endpoints: GET/POST /realtor/listings, GET /realtor/listings/stats,// ============================================================

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
export type { KYCStatus, KYCIdType, KYCDocumentType, KYCDocument, KYC, SubmitKYCRequest } from './kyc';

// Bank Accounts
export type {
  BankAccount,
  Bank,
  AddBankAccountRequest,
  VerifyAccountRequest,
  VerifyAccountResponse,
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
