// ============================================================
// KYC Service
// Endpoints: GET /kyc/status, PUT /kyc/info, POST /kyc/documents,
//            POST /uploads/direct (category: KYC_DOCUMENT)
// ============================================================

import api from './api';
import type { KYC, SubmitKYCRequest } from '@/types';

class KYCService {
  /** GET /kyc/status */
  async getStatus(): Promise<KYC> {
    const res = await api.get<KYC>('/kyc/status');
    return res.data!;
  }

  /** PUT /kyc/info — update personal info */
  async updateInfo(payload: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
  }): Promise<void> {
    await api.put('/kyc/info', payload);
  }

  /** POST /kyc/documents — submit a single KYC document */
  async submitDocument(payload: SubmitKYCRequest): Promise<KYC> {
    const res = await api.post<KYC>('/kyc/documents', payload);
    return res.data!;
  }

  /**
   * PUT /kyc/info — submit full KYC application in one call.
   * Upload documents first via uploadDocument(), then pass URLs here.
   */
  async submitKYC(payload: {
    idType: string;
    idNumber: string;
    idDocumentUrl: string;
    selfieUrl: string;
    proofOfAddressUrl?: string;
  }): Promise<KYC> {
    const res = await api.put<KYC>('/kyc/info', payload);
    return res.data!;
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
