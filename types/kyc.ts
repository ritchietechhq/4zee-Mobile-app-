// ============================================================
// KYC Types
// Matches: GET /kyc, PUT /kyc, POST /uploads/kyc
// ============================================================

export type KYCStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type KYCIdType =
  | 'NIN'
  | 'BVN'
  | 'DRIVERS_LICENSE'
  | 'INTERNATIONAL_PASSPORT'
  | 'VOTERS_CARD';

export interface KYC {
  id: string;
  status: KYCStatus;
  idType?: KYCIdType;
  idNumber?: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  proofOfAddressUrl?: string;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface SubmitKYCRequest {
  idType: KYCIdType;
  idNumber: string;
  idDocumentUrl: string;
  selfieUrl: string;
  proofOfAddressUrl?: string;
}
