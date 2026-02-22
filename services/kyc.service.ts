// ============================================================
// KYC Service
// Endpoints: GET /kyc, GET /kyc/status, GET /kyc/documents,
//            PUT /kyc, POST /uploads/direct
// ============================================================

import api from './api';
import type { KYC, KYCStatus, SubmitKYCRequest } from '@/types';
import { normaliseKYCStatus } from '@/utils/kycStatus';

/** Turn the flat backend response into the KYC interface the UI expects. */
const normaliseKYC = (data: any): KYC => ({
  id: data.id,
  kycStatus: normaliseKYCStatus(data.status ?? data.kycStatus),
  idType: data.idType,
  idNumber: data.idNumber,
  idDocumentUrl: data.idDocumentUrl,
  selfieUrl: data.selfieUrl,
  proofOfAddressUrl: data.proofOfAddressUrl,
  rejectionReason: data.rejectionReason,
  submittedAt: data.submittedAt,
  verifiedAt: data.verifiedAt,
  documents: data.documents ?? [],
  summary: data.summary,
  canSubmitMore: data.canSubmitMore,
});

class KYCService {
  /**
   * GET /kyc/status — richer KYC endpoint that includes summary counts
   * and canSubmitMore flag. Falls back to GET /kyc if the new endpoint
   * is not yet deployed.
   */
  async getStatus(): Promise<KYC> {
    try {
      const res = await api.get<any>('/kyc/status');
      return normaliseKYC(res.data);
    } catch {
      // Fallback to legacy endpoint if /kyc/status doesn't exist yet
      const res = await api.get<any>('/kyc');
      return normaliseKYC(res.data);
    }
  }

  /** GET /kyc — legacy endpoint (still works) */
  async getLegacyStatus(): Promise<KYC> {
    const res = await api.get<any>('/kyc');
    return normaliseKYC(res.data);
  }

  /** GET /kyc/documents — alias that returns documents list */
  async getDocuments(): Promise<KYC> {
    const res = await api.get<any>('/kyc/documents');
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
