// ============================================================
// usePayments Hook
// Manages Paystack WebView payment flow
// ============================================================

import { useState, useCallback } from 'react';
import type { PaymentStatusResponse, PaymentDetail } from '@/types';
import paymentService from '@/services/payment.service';

export function usePayments() {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Step 1 — POST /payments/initiate → get Paystack URL */
  const initiatePayment = useCallback(async (applicationId: string) => {
    setIsLoading(true);
    setError(null);
    setPaymentStatus(null);
    try {
      const result = await paymentService.initiate(applicationId);
      setPaymentUrl(result.authorizationUrl);
      setPaymentReference(result.reference);
      return result;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to initiate payment.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Step 3 — Poll after WebView closes */
  const pollPaymentStatus = useCallback(async () => {
    if (!paymentReference) return;
    setIsPolling(true);
    setError(null);
    try {
      const status = await paymentService.pollStatus(paymentReference);
      setPaymentStatus(status);
      setPaymentUrl(null);
      return status;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Payment verification failed.';
      setError(message);
      throw err;
    } finally {
      setIsPolling(false);
    }
  }, [paymentReference]);

  /** Reset payment state */
  const resetPayment = useCallback(() => {
    setPaymentUrl(null);
    setPaymentReference(null);
    setPaymentStatus(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    paymentUrl,
    paymentReference,
    paymentStatus,
    isLoading,
    isPolling,
    error,
    initiatePayment,
    pollPaymentStatus,
    resetPayment,
    clearError,
  };
}
