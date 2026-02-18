// ============================================================
// KYC Service
// Endpoints: GET /kyc, PUT /kyc, POST /uploads/kyc
// ============================================================

import api from './api';
import type { KYC, SubmitKYCRequest } from '@/types';

class KYCService {
  /** GET /kyc */
  async getStatus(): Promise<KYC> {
    const res = await api.get<KYC>('/kyc');
    return res.data!;
  }

  /** PUT /kyc — idempotent */
  async submit(payload: SubmitKYCRequest): Promise<KYC> {
    const res = await api.put<KYC>('/kyc', payload);
    return res.data!;
  }

  /** POST /uploads/kyc — multipart/form-data */
  async uploadDocument(formData: FormData): Promise<string> {
    const res = await api.upload<{ url: string }>('/uploads/kyc', formData);
    return res.data!.url;
  }
}

export const kycService = new KYCService();
export default kycService;
