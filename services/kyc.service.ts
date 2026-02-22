// ============================================================
// KYC Service
// Endpoints:
//   POST /kyc/documents   — submit a single document for review
//   PUT  /kyc             — update personal info only
//   GET  /kyc/status      — overall KYC status + summary
//   GET  /kyc/documents   — list submitted documents
//   POST /uploads/direct  — upload a file
// ============================================================

import api from './api';
import type { KYC, KYCDocument, SubmitKYCDocumentRequest, UpdateKYCPersonalInfoRequest } from '@/types';
import { normaliseKYCStatus } from '@/utils/kycStatus';

/** Turn the backend response into the KYC interface the UI expects. */
const normaliseKYC = (data: any): KYC => ({
  id: data.id,
  clientId: data.clientId,
  email: data.email,
  firstName: data.firstName,
  lastName: data.lastName,
  kycStatus: normaliseKYCStatus(data.status ?? data.kycStatus),
  rejectionReason: data.rejectionReason,
  submittedAt: data.submittedAt,
  verifiedAt: data.verifiedAt,
  documents: (data.documents ?? []).map((doc: any) => ({
    ...doc,
    status: normaliseKYCStatus(doc.status),
  })),
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

  /** GET /kyc/documents — returns the list of submitted documents */
  async getDocuments(): Promise<KYCDocument[]> {
    const res = await api.get<any>('/kyc/documents');
    const docs = Array.isArray(res.data) ? res.data : (res.data?.documents ?? []);
    return docs.map((doc: any) => ({
      ...doc,
      status: normaliseKYCStatus(doc.status),
    }));
  }

  /**
   * POST /kyc/documents — submit a SINGLE document for KYC review.
   *
   * Each document (ID, selfie, proof of address) is submitted individually.
   * Upload the file first via uploadDocument(), then pass the URL + fileName here.
   */
  async submitDocument(payload: SubmitKYCDocumentRequest): Promise<KYCDocument> {
    const res = await api.post<any>('/kyc/documents', payload);
    return {
      ...res.data,
      status: normaliseKYCStatus(res.data?.status),
    };
  }

  /**
   * Submit multiple documents in sequence.
   * Returns an array of created KYCDocument records.
   */
  async submitDocuments(payloads: SubmitKYCDocumentRequest[]): Promise<KYCDocument[]> {
    const results: KYCDocument[] = [];
    for (const payload of payloads) {
      const doc = await this.submitDocument(payload);
      results.push(doc);
    }
    return results;
  }

  /**
   * PUT /kyc — update personal info only (NOT document submission).
   */
  async updatePersonalInfo(payload: UpdateKYCPersonalInfoRequest): Promise<any> {
    const res = await api.put<any>('/kyc', payload);
    return res.data;
  }

  /**
   * POST /uploads/direct — upload a KYC document file.
   *
   * Response shape:
   *   { id, url, fileName, originalName, mimeType, size, category }
   */
  async uploadDocument(formData: FormData): Promise<{ url: string; fileName: string }> {
    const res = await api.upload<{
      id?: string;
      url: string;
      fileName: string;
      originalName?: string;
      mimeType?: string;
      size?: number;
      category?: string;
    }>('/uploads/direct', formData);

    return {
      url: res.data!.url,
      fileName: res.data!.fileName || res.data!.url.split('/').pop() || `kyc_${Date.now()}.jpg`,
    };
  }
}

export const kycService = new KYCService();
export default kycService;
