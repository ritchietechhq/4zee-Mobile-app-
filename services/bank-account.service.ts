// ============================================================
// Bank Account Service (Realtor)
// Endpoints: GET /bank-accounts, POST /bank-accounts,
//            GET /bank-accounts/banks, POST /bank-accounts/verify, etc.
// ============================================================

import api from './api';
import type {
  BankAccount,
  Bank,
  AddBankAccountRequest,
  VerifyAccountRequest,
  VerifyAccountResponse,
  VerifyAndSaveRequest,
  VerifyAndSaveResponse,
} from '@/types';

class BankAccountService {
  /** GET /bank-accounts */
  async list(): Promise<BankAccount[]> {
    const res = await api.get<BankAccount[] | { accounts: BankAccount[] }>('/bank-accounts');
    const raw = res.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'accounts' in raw) return (raw as any).accounts;
    return [];
  }

  /** POST /bank-accounts — idempotent */
  async add(payload: AddBankAccountRequest): Promise<BankAccount> {
    const res = await api.post<BankAccount>('/bank-accounts', payload);
    return res.data!;
  }

  /** GET /bank-accounts/banks */
  async getBanks(): Promise<Bank[]> {
    const res = await api.get<Bank[]>('/bank-accounts/banks');
    return res.data!;
  }

  /** POST /bank-accounts/verify */
  async verifyAccount(
    payload: VerifyAccountRequest,
  ): Promise<VerifyAccountResponse> {
    const res = await api.post<VerifyAccountResponse>(
      '/bank-accounts/verify',
      payload,
    );
    return res.data!;
  }

  /** POST /bank-accounts/verify-and-save — verify with Paystack + persist in one call */
  async verifyAndSave(
    payload: VerifyAndSaveRequest,
  ): Promise<VerifyAndSaveResponse> {
    const res = await api.post<VerifyAndSaveResponse>(
      '/bank-accounts/verify-and-save',
      payload,
    );
    return res.data!;
  }

  /** PUT /bank-accounts/:id/set-default */
  async setDefault(id: string): Promise<void> {
    await api.put(`/bank-accounts/${id}/set-default`);
  }

  /** DELETE /bank-accounts/:id */
  async remove(id: string): Promise<void> {
    await api.delete(`/bank-accounts/${id}`);
  }
}

export const bankAccountService = new BankAccountService();
export default bankAccountService;
