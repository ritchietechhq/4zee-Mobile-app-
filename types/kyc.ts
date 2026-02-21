// ============================================================
// KYC Types
// Matches: GET /kyc, PUT /kyc
// ============================================================

/**
 * Backend KYC status values.
 * NOTE: The backend returns "VERIFIED" – we normalise to "APPROVED"
 * inside the service layer so the rest of the UI can use a single
 * canonical set of values.
 */
export type KYCStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** ID types accepted by the backend */
export type KYCIdType =
  | 'NIN'
  | 'BVN'
  | 'DRIVERS_LICENSE'
  | 'INTERNATIONAL_PASSPORT'
  | 'VOTERS_CARD';

/** Document types for utility bill uploads etc. */
export type KYCDocumentType =
  | KYCIdType
  | 'UTILITY_BILL'
  | 'BANK_STATEMENT';

export interface KYCDocument {
  id: string;
  type: KYCDocumentType;
  fileUrl: string;
  fileName: string;
  expiryDate?: string;
  status: string;
}

/**
 * KYC record returned by `GET /kyc`.
 *
 * The backend response has a flat shape:
 *   { id, status, idType, idNumber, idDocumentUrl, selfieUrl, ... }
 *
 * We keep the original fields **and** expose a `kycStatus` getter so
 * existing screens that read `kyc.kycStatus` keep working.
 */
export interface KYC {
  id?: string;
  /** Normalised status (VERIFIED → APPROVED) set by the service layer */
  kycStatus: KYCStatus;
  idType?: KYCIdType;
  idNumber?: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  proofOfAddressUrl?: string;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
  /** Legacy — kept for backward compat with KYC index screen */
  documents: KYCDocument[];
}

/** PUT /kyc request body */
export interface SubmitKYCRequest {
  idType: KYCIdType;
  idNumber: string;
  idDocumentUrl: string;
  selfieUrl: string;
  proofOfAddressUrl?: string;
}
