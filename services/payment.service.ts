// ============================================================
// Payment Service
// Endpoints: POST /payments/initiate, POST /payments/installment,
//            GET /payments/:ref/status, GET /payments/:ref,
//            GET /payments/me (paginated)
// ============================================================

import api from './api';
import type {
  PaymentInitiateResponse,
  PaymentStatusResponse,
  PaymentDetail,
  PaginatedResponse,
} from '@/types';

/** Delay helper for polling */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Response from POST /payments/installment */
export interface InstallmentPaymentResponse {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
  installmentId: string;
  installmentNo: number;
  amount: number;
  propertyTitle?: string;
}

class PaymentService {
  /** POST /payments/initiate — idempotent */
  async initiate(applicationId: string): Promise<PaymentInitiateResponse> {
    const res = await api.post<PaymentInitiateResponse>('/payments/initiate', {
      applicationId,
    });
    return res.data!;
  }

  /**
   * POST /payments/installment — Pay a specific installment
   * Used by clients enrolled in a payment plan to pay individual installments.
   */
  async payInstallment(installmentId: string): Promise<InstallmentPaymentResponse> {
    const res = await api.post<any>('/payments/installment', { installmentId });
    return res.data!;
  }

  /** GET /payments/:reference/status — for polling after WebView */
  async getStatus(reference: string): Promise<PaymentStatusResponse> {
    const res = await api.get<PaymentStatusResponse>(
      `/payments/${reference}/status`,
    );
    return res.data!;
  }

  /**
   * Poll payment status until SUCCESS, FAILED, or timeout.
   * maxAttempts = 30, delayMs = 2000 → max ~60 seconds
   */
  async pollStatus(
    reference: string,
    maxAttempts = 30,
    delayMs = 2000,
  ): Promise<PaymentStatusResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getStatus(reference);
      if (status.status === 'SUCCESS' || status.status === 'FAILED') {
        return status;
      }
      await sleep(delayMs);
    }
    return {
      reference,
      status: 'FAILED',
      failureReason: 'Payment verification timeout',
    };
  }

  /** GET /payments/:reference */
  async getByReference(reference: string): Promise<PaymentDetail> {
    const res = await api.get<PaymentDetail>(`/payments/${reference}`);
    return res.data!;
  }

  /** GET /payments/me — paginated, CLIENT role */
  async getMyPayments(
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResponse<PaymentDetail>> {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get<PaginatedResponse<PaymentDetail>>(
      '/payments/me',
      params,
    );
    return res.data!;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
