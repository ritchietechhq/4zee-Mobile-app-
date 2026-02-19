// ============================================================
// KYC Types
// Matches: GET /kyc/status, PUT /kyc/info, POST /kyc/documents
// ============================================================

export type KYCStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type KYCDocumentType =
  | 'NATIONAL_ID'
  | 'DRIVERS_LICENSE'
  | 'PASSPORT'
  | 'VOTERS_CARD'
  | 'NIN'
  | 'UTILITY_BILL'
  | 'BANK_STATEMENT';

/** Legacy alias for backwards compatibility */
export type KYCIdType = KYCDocumentType;

export interface KYCDocument {
  id: string;
  type: KYCDocumentType;
  fileUrl: string;
  fileName: string;
  expiryDate?: string;
  status: string;
}

export interface KYC {
  kycStatus: KYCStatus;
  documents: KYCDocument[];
}

/** POST /kyc/documents request body */
export interface SubmitKYCRequest {
  type: KYCDocumentType;
  idNumber?: string;
  fileUrl: string;
  fileName: string;
  expiryDate?: string; // ISO date string
}
