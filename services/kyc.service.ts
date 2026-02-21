// ============================================================
// KYC Service
// Endpoints: GET /kyc, PUT /kyc, POST /uploads/direct
// ============================================================

import api from './api';
import type { KYC, KYCStatus, SubmitKYCRequest } from '@/types';

/**
 * The backend returns "VERIFIED" while the frontend UI uses "APPROVED".
 * Normalise once so every screen can rely on KYCStatus.
 */
const normaliseStatus = (raw?: string): KYCStatus => {
  if (!raw) return 'NOT_SUBMITTED';
  if (raw === 'VERIFIED') return 'APPROVED';
  return raw as KYCStatus;
};

/** Turn the flat backend response into the KYC interface the UI expects. */
const normaliseKYC = (data: any): KYC => ({
  id: data.id,
  kycStatus: normaliseStatus(data.status ?? data.kycStatus),
  idType: data.idType,
  idNumber: data.idNumber,
  idDocumentUrl: data.idDocumentUrl,
  selfieUrl: data.selfieUrl,
  proofOfAddressUrl: data.proofOfAddressUrl,
  rejectionReason: data.rejectionReason,
  submittedAt: data.submittedAt,
  verifiedAt: data.verifiedAt,
  documents: data.documents ?? [],
});

class KYCService {
  /** GET /kyc — fetch current KYC record */
  async getStatus(): Promise<KYC> {
    const res = await api.get<any>('/kyc');
    return normaliseKYC(res.data);
  }

  /**
   * PUT /kyc — submit (or resubmit) the full KYC application.
   * Upload documents first via uploadDocument(), then pass URLs here.
   */
  async submitKYC(payload: SubmitKYCRequest): Promise<KYC> {
    const res = await api.put<any>('/kyc', payload);
    return normaliseKYC(res.data);
  }

  /** POST /uploads/direct — upload a KYC document file */
  async uploadDocument(formData: FormData): Promise<string> {
    const res = await api.upload<{ url: string; publicUrl?: string }>(
      '/uploads/direct',
      formData,
    );
    return res.data!.publicUrl || res.data!.url;
  }
}

export const kycService = new KYCService();
export default kycService;
