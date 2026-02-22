// ============================================================
// KYC Types
// Matches backend Prisma schema:
//   POST /kyc/documents  — submit a single document
//   PUT  /kyc            — update personal info only
//   GET  /kyc/status     — overall KYC status + summary
//   GET  /kyc/documents  — list submitted documents
// ============================================================

/**
 * Backend KYC status values (Prisma enum: KycStatus).
 * Only four canonical values exist — no SUBMITTED / IN_REVIEW / VERIFIED.
 */
export type KYCStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Document types accepted by POST /kyc/documents (Prisma enum: KycDocumentType).
 *
 * NOTE: The backend does NOT accept BVN or INTERNATIONAL_PASSPORT.
 *       Use PASSPORT instead.
 */
export type KYCDocumentType =
  | 'NATIONAL_ID'
  | 'DRIVERS_LICENSE'
  | 'PASSPORT'
  | 'VOTERS_CARD'
  | 'NIN'
  | 'UTILITY_BILL'
  | 'BANK_STATEMENT';

/** Single KYC document record returned by the backend. */
export interface KYCDocument {
  id: string;
  userId?: string;
  type: KYCDocumentType;
  idNumber?: string;
  fileUrl: string;
  fileName: string;
  expiryDate?: string;
  status: KYCStatus;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Summary counts returned by GET /kyc/status */
export interface KYCStatusSummary {
  totalDocuments?: number;
  pending: number;
  approved: number;
  rejected: number;
}

/**
 * KYC aggregate returned by GET /kyc/status.
 *
 * The backend provides an overall `kycStatus` on the user profile
 * plus a `documents[]` array of individual submissions.
 */
export interface KYC {
  id?: string;
  clientId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  /** Overall user KYC status (from user profile) */
  kycStatus: KYCStatus;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
  /** Individual KYC document records */
  documents: KYCDocument[];
  /** Summary counts (from GET /kyc/status) */
  summary?: KYCStatusSummary;
  /** Whether the user can submit more documents */
  canSubmitMore?: boolean;
}

/**
 * POST /kyc/documents — submit a single document for KYC review.
 *
 * Each document is submitted individually (ID doc, selfie, proof of address, etc.)
 */
export interface SubmitKYCDocumentRequest {
  type: KYCDocumentType;
  /** Required. Letters, numbers, and hyphens only. */
  idNumber: string;
  fileUrl: string;
  fileName: string;
  expiryDate?: string;
}

/**
 * PUT /kyc — update personal information only (NOT document submission).
 */
export interface UpdateKYCPersonalInfoRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  photoUrl?: string;
  postalCode?: string;
}
