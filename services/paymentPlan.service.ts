// ============================================================
// Payment Plan Service
// Endpoints: GET /payment-plans/templates,
//            POST /payment-plans/enroll,
//            GET /payment-plans/my-enrollments,
//            GET /payment-plans/my-upcoming,
//            GET /payment-plans/enrollments/:id,
//            GET /payment-plans/applications/:applicationId/schedule
// ============================================================

import api from './api';

// ── Types ──────────────────────────────────────────────────

export interface PaymentPlanTemplate {
  id: string;
  name: string;
  description?: string;
  durationMonths: number;
  downPaymentPct: number;
  interestRate: number;
  lateFeeAmount?: number;
  lateFeePercent?: number;
  gracePeriodDays?: number;
  isActive: boolean;
}

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'CANCELLED';
export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAt?: string;
  isDownPayment?: boolean;
}

export interface PaymentPlanEnrollment {
  id: string;
  status: EnrollmentStatus;
  totalAmount: number;
  downPayment: number;
  monthlyAmount: number;
  startDate: string;
  endDate: string;
  paidAmount?: number;
  remainingAmount?: number;
  nextDueDate?: string;
  installments: Installment[];
  application?: {
    id: string;
    property: { id: string; title: string; price: number };
  };
}

export interface EnrollRequest {
  applicationId: string;
  templateId: string;
  startDate?: string;
}

// ── Service ────────────────────────────────────────────────

class PaymentPlanService {
  /** GET /payment-plans/templates — public, no auth needed */
  async getTemplates(): Promise<PaymentPlanTemplate[]> {
    const res = await api.get<any>('/payment-plans/templates');
    const raw = res.data;
    return Array.isArray(raw) ? raw : raw?.items ?? raw?.templates ?? [];
  }

  /** GET /payment-plans/templates/:id */
  async getTemplate(id: string): Promise<PaymentPlanTemplate> {
    const res = await api.get<PaymentPlanTemplate>(`/payment-plans/templates/${id}`);
    return res.data!;
  }

  /** POST /payment-plans/enroll — CLIENT role */
  async enroll(payload: EnrollRequest): Promise<PaymentPlanEnrollment> {
    const res = await api.post<PaymentPlanEnrollment>('/payment-plans/enroll', payload);
    return res.data!;
  }

  /** GET /payment-plans/my-enrollments — CLIENT role */
  async getMyEnrollments(): Promise<PaymentPlanEnrollment[]> {
    const res = await api.get<any>('/payment-plans/my-enrollments');
    const raw = res.data;
    return Array.isArray(raw) ? raw : raw?.items ?? [];
  }

  /** GET /payment-plans/my-upcoming — upcoming installments */
  async getMyUpcoming(): Promise<Installment[]> {
    const res = await api.get<any>('/payment-plans/my-upcoming');
    const raw = res.data;
    return Array.isArray(raw) ? raw : raw?.items ?? [];
  }

  /** GET /payment-plans/enrollments/:id */
  async getEnrollment(id: string): Promise<PaymentPlanEnrollment> {
    const res = await api.get<PaymentPlanEnrollment>(`/payment-plans/enrollments/${id}`);
    return res.data!;
  }

  /** GET /payment-plans/applications/:applicationId/schedule */
  async getSchedule(applicationId: string): Promise<PaymentPlanEnrollment> {
    const res = await api.get<PaymentPlanEnrollment>(`/payment-plans/applications/${applicationId}/schedule`);
    return res.data!;
  }
}

export const paymentPlanService = new PaymentPlanService();
export default paymentPlanService;
