// ============================================================
// Payment Types
// Matches: POST /payments/initiate, GET /payments/:ref/status, etc.
// ============================================================

export type PaymentStatusValue = 'INITIATED' | 'SUCCESS' | 'FAILED';

export interface Payment {
  id: string;
  reference: string;
  amount: number;
  status: PaymentStatusValue;
  channel?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentInitiateRequest {
  applicationId: string;
}

export interface PaymentInitiateResponse {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export interface PaymentStatusResponse {
  reference: string;
  status: PaymentStatusValue;
  saleId?: string;
  paidAt?: string;
  failureReason?: string;
}

export interface PaymentDetail {
  id: string;
  reference: string;
  amount: number;
  status: PaymentStatusValue;
  channel?: string;
  paidAt?: string;
  application?: {
    id: string;
    property: {
      title: string;
    };
  };
}
